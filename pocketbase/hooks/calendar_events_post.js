routerAdd(
  'POST',
  '/backend/v1/calendar/events',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    const body = e.requestInfo().body
    if (!body.title || !body.start_date || !body.end_date) {
      return e.badRequestError('Title, start_date and end_date are required')
    }

    const user = $app.findRecordById('users', userId)
    let accessToken = user.getString('google_access_token')
    let refreshToken = user.getString('google_refresh_token')
    let expiry = user.getInt('google_token_expiry')

    let googleSync = !!accessToken

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

    let eventId = 'local-' + $security.randomString(8)
    let googleSuccess = false

    if (googleSync) {
      const payload = {
        summary: body.title,
        description: body.description || '',
        start: { dateTime: body.start_date },
        end: { dateTime: body.end_date },
      }

      const res = $http.send({
        url: 'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (res.statusCode === 200 || res.statusCode === 201) {
        eventId = res.json.id
        googleSuccess = true
      } else {
        $app
          .logger()
          .error('Failed to push to Google Calendar', 'status', res.statusCode, 'body', res.string)
      }
    }

    try {
      const collection = $app.findCollectionByNameOrId('calendar_events')
      const record = new Record(collection)
      record.set('event_id', eventId)
      record.set('title', body.title)
      record.set('description', body.description || '')
      record.set('start_date', body.start_date)
      record.set('end_date', body.end_date)
      record.set('user', userId)

      $app.save(record)

      return e.json(200, {
        id: record.id,
        event_id: record.getString('event_id'),
        title: record.getString('title'),
        description: record.getString('description'),
        start_date: record.getString('start_date'),
        end_date: record.getString('end_date'),
        google_success: googleSuccess,
      })
    } catch (err) {
      return e.internalServerError('Failed to save event locally')
    }
  },
  $apis.requireAuth(),
)
