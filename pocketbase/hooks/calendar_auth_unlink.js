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

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
