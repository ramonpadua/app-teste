routerAdd(
  'POST',
  '/backend/v1/calendar/unlink',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    try {
      const tokenRecord = $app.findFirstRecordByData('google_tokens', 'user', userId)
      $app.delete(tokenRecord)
    } catch (_) {}

    try {
      const records = $app.findRecordsByFilter(
        'calendar_events',
        `user = '${userId}' && calendar_id = 'primary'`,
        '',
        1000,
        0,
      )
      for (const rec of records) {
        try {
          $app.delete(rec)
        } catch (e) {}
      }
    } catch (_) {}

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
