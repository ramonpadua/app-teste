routerAdd(
  'POST',
  '/backend/v1/calendar/unlink',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    const user = $app.findRecordById('users', userId)
    user.set('google_access_token', '')
    user.set('google_refresh_token', '')
    user.set('google_token_expiry', 0)
    $app.save(user)

    try {
      const syncedEvents = $app.findRecordsByFilter(
        'calendar_events',
        `user = '${userId}' && event_id != ''`,
      )
      for (const ev of syncedEvents) {
        $app.delete(ev)
      }
    } catch (_) {}

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
