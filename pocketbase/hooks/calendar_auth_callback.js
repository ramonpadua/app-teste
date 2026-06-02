routerAdd(
  'POST',
  '/backend/v1/calendar/callback',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    const body = e.requestInfo().body
    if (!body.code) return e.badRequestError('code is required')

    let redirectUri = $secrets.get('GOOGLE_REDIRECT_URI')
    if (!redirectUri) {
      redirectUri = body.redirect_uri
    }
    if (!redirectUri) return e.badRequestError('redirect_uri is required')

    const clientId = $secrets.get('GOOGLE_CLIENT_ID') || $secrets.get('ID_CLIENTE')
    const clientSecret = $secrets.get('GOOGLE_CLIENT_SECRET') || $secrets.get('CLIENT_SECRET')
    if (!clientId || !clientSecret) return e.internalServerError('OAuth credentials not configured')

    const res = $http.send({
      url: 'https://oauth2.googleapis.com/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `code=${encodeURIComponent(body.code)}&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&redirect_uri=${encodeURIComponent(redirectUri)}&grant_type=authorization_code`,
    })

    if (res.statusCode !== 200) {
      $app
        .logger()
        .error('Google token exchange failed', 'status', res.statusCode, 'body', res.string)
      return e.badRequestError('Failed to authenticate with Google')
    }

    const data = res.json

    try {
      let tokenRecord
      try {
        tokenRecord = $app.findFirstRecordByData('google_tokens', 'user', userId)
      } catch (_) {
        const collection = $app.findCollectionByNameOrId('google_tokens')
        tokenRecord = new Record(collection)
        tokenRecord.set('user', userId)
      }

      tokenRecord.set('access_token', data.access_token || '')
      if (data.refresh_token) {
        tokenRecord.set('refresh_token', data.refresh_token)
      }
      tokenRecord.set('expires_at', Date.now() + data.expires_in * 1000)
      tokenRecord.set('scope', data.scope || 'https://www.googleapis.com/auth/calendar.readonly')

      $app.save(tokenRecord)
    } catch (err) {
      return e.internalServerError('Failed to save tokens: ' + err.message)
    }

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)
