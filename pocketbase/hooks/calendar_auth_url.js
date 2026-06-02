routerAdd(
  'GET',
  '/backend/v1/calendar/auth-url',
  (e) => {
    let redirectUri = $secrets.get('GOOGLE_REDIRECT_URI')
    if (!redirectUri) {
      redirectUri = e.request.url.query().get('redirect_uri')
    }
    if (!redirectUri) return e.badRequestError('redirect_uri is required')

    const clientId = $secrets.get('GOOGLE_CLIENT_ID') || $secrets.get('ID_CLIENTE')
    if (!clientId) return e.internalServerError('Google Client ID not configured')

    const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.readonly')
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&include_granted_scopes=true`

    return e.json(200, { url })
  },
  $apis.requireAuth(),
)
