routerAdd(
  'DELETE',
  '/backend/v1/calendar/events/{id}',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    const id = e.request.pathValue('id')
    let record
    try {
      record = $app.findRecordById('calendar_events', id)
    } catch (err) {
      return e.notFoundError('Event not found')
    }

    if (record.getString('user') !== userId) {
      return e.forbiddenError('Not your event')
    }

    const user = $app.findRecordById('users', userId)
    let accessToken = user.getString('google_access_token')
    let refreshToken = user.getString('google_refresh_token')
    let expiry = user.getInt('google_token_expiry')

    let googleSync = !!accessToken
    let eventId = record.getString('event_id')

    if (googleSync && Date.now() >= expiry - 60000) {
      const clientId = $secrets.get('ID_CLIENTE')
      const clientSecret = $secrets.get('CLIENT_SECRET')
      if (clientId && clientSecret && refreshToken) {
        const res = $http.send({
          url: 'https://oauth2.googleapis.com/token',
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&refresh_token=${encodeURIComponent(refreshToken)}&grant_type=refresh_token`,
        })
        if (res.statusCode === 200 && res.json.access_token) {
          accessToken = res.json.access_token
          expiry = Date.now() + res.json.expires_in * 1000
          user.set('google_access_token', accessToken)
          user.set('google_token_expiry', expiry)
          $app.save(user)
        } else {
          googleSync = false
        }
      } else {
        googleSync = false
      }
    }

    if (googleSync && !eventId.startsWith('local-')) {
      const res = $http.send({
        url: `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (res.statusCode !== 204) {
        $app
          .logger()
          .error(
            'Failed to delete from Google Calendar',
            'status',
            res.statusCode,
            'body',
            res.string,
          )
      }
    }

    try {
      $app.delete(record)
      return e.json(200, { success: true })
    } catch (err) {
      return e.internalServerError('Failed to delete event locally')
    }
  },
  $apis.requireAuth(),
)
