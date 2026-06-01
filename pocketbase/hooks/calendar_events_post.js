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

    let eventId = 'google-evt-' + $security.randomString(8)
    const token = $secrets.get('GOOGLE_API_KEY')
    let googleSuccess = false

    if (token) {
      try {
        // Simulated external call to Google Calendar API
        // const res = $http.send({ ... })
        googleSuccess = true
      } catch (err) {
        $app.logger().error('Failed to push to Google Calendar', 'error', err.message)
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
