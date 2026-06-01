routerAdd(
  'POST',
  '/backend/v1/calendar/callback',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    const body = e.requestInfo().body
    if (!body.code || !body.redirect_uri)
      return e.badRequestError('code and redirect_uri are required')

    const clientId = $secrets.get('ID_CLIENTE')
    const clientSecret = $secrets.get('CLIENT_SECRET')
    if (!clientId || !clientSecret) return e.internalServerError('OAuth credentials not configured')

    const res = $http.send({
      url: 'https://oauth2.googleapis.com/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `code=${encodeURIComponent(body.code)}&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&redirect_uri=${encodeURIComponent(body.redirect_uri)}&grant_type=authorization_code`,
    })

    if (res.statusCode !== 200) {
      $app
        .logger()
        .error('Google token exchange failed', 'status', res.statusCode, 'body', res.string)
      return e.badRequestError('Failed to authenticate with Google')
    }

    const data = res.json
    const user = $app.findRecordById('users', userId)
    user.set('google_access_token', data.access_token || '')
    if (data.refresh_token) {
      user.set('google_refresh_token', data.refresh_token)
    }
    user.set('google_token_expiry', Date.now() + data.expires_in * 1000)
    $app.save(user)

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
