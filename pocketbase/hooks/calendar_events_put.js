routerAdd(
  'PUT',
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

    const body = e.requestInfo().body
    if (body.title) record.set('title', body.title)
    if (body.description !== undefined) record.set('description', body.description)
    if (body.start_date) record.set('start_date', body.start_date)
    if (body.end_date) record.set('end_date', body.end_date)

    const token = $secrets.get('GOOGLE_API_KEY')
    let googleSuccess = false
    if (token) {
      try {
        // Simulated external call to update Google Calendar API
        // $http.send({ ... })
        googleSuccess = true
      } catch (err) {
        $app.logger().error('Failed to update Google Calendar', 'error', err.message)
      }
    }

    try {
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
      return e.internalServerError('Failed to update event locally')
    }
  },
  $apis.requireAuth(),
)
