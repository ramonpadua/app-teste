routerAdd(
  'GET',
  '/backend/v1/calendar/auth-url',
  (e) => {
    const redirectUri = e.request.url.query().get('redirect_uri')
    if (!redirectUri) return e.badRequestError('redirect_uri is required')
    const clientId = $secrets.get('ID_CLIENTE')
    if (!clientId) return e.internalServerError('ID_CLIENTE not configured')

    const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.events')
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`

    return e.json(200, { url })
  },
  $apis.requireAuth(),
)
