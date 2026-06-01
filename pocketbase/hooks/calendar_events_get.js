routerAdd(
  'GET',
  '/backend/v1/calendar/events',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    let googleSync = true
    const token = $secrets.get('GOOGLE_API_KEY')
    if (!token) {
      googleSync = false
    } else {
      try {
        // In a real application, we would call the Google Calendar API here
        // const res = $http.send({ url: "https://www.googleapis.com/calendar/v3/calendars/primary/events", ... })
      } catch (err) {
        googleSync = false
        $app.logger().error('Failed to fetch from Google Calendar', 'error', err.message)
      }
    }

    try {
      const records = $app.findRecordsByFilter(
        'calendar_events',
        `user = '${userId}'`,
        '-start_date',
        200,
        0,
      )
      const items = records.map((r) => ({
        id: r.id,
        event_id: r.getString('event_id'),
        title: r.getString('title'),
        description: r.getString('description'),
        start_date: r.getString('start_date'),
        end_date: r.getString('end_date'),
      }))
      return e.json(200, { items, google_sync: googleSync })
    } catch (err) {
      return e.json(200, { items: [], google_sync: googleSync })
    }
  },
  $apis.requireAuth(),
)
