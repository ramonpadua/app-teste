routerAdd(
  'POST',
  '/backend/v1/calendar/unlink',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    let user
    try {
      user = $app.findRecordById('users', userId)
    } catch (err) {
      return e.json(200, { success: true })
    }

    user.set('google_access_token', '')
    user.set('google_refresh_token', '')
    user.set('google_token_expiry', 0)
    try {
      $app.save(user)
    } catch (_) {}

    try {
      const syncedEvents = $app.findRecordsByFilter(
        'calendar_events',
        `user = '${userId}' && event_id != ''`,
      )
      for (const ev of syncedEvents) {
        try {
          $app.delete(ev)
        } catch (_) {}
      }
    } catch (_) {}

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
