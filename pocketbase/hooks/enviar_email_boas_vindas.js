routerAdd(
  'POST',
  '/backend/v1/enviar-email-boas-vindas',
  (e) => {
    const apiKey = $secrets.get('RESEND_API_KEY')

    if (!apiKey) {
      return e.internalServerError('RESEND_API_KEY não configurada.')
    }

    const body = e.requestInfo().body || {}
    const nome = body.nome
    const email = body.email
    const retryId = body.retryId || ''

    if (!nome || !email) {
      return e.badRequestError('Nome e email são obrigatórios.')
    }

    const idempotencyKey = `welcome-user/${email}${retryId ? `-${retryId}` : ''}`

    const host = e.request.host || ''
    const isDev = host.includes('localhost') || host.includes('shrd00.internal')

    const sender = isDev
      ? 'Boas-vindas <onboarding@resend.dev>'
      : 'Boas-vindas <onboarding@meudominio.com>'
    const recipient = isDev ? 'delivered@resend.dev' : email

    try {
      const res = $http.send({
        url: 'https://api.resend.com/emails',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + apiKey,
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          from: sender,
          to: [recipient],
          subject: `Bem-vindo(a), ${nome}!`,
          html: `<h1>Olá, ${nome}!</h1><p>Seja muito bem-vindo(a). Estamos felizes em ter você conosco.</p>`,
          tags: [{ name: 'category', value: 'welcome' }],
        }),
        timeout: 15,
      })

      if (res.statusCode >= 400) {
        if (res.statusCode === 429) {
          return e.json(429, { error: 'Muitos envios, tente novamente mais tarde.' })
        }
        return e.badRequestError(res.json?.message || 'Erro ao enviar email.')
      }

      return e.json(200, { id: res.json?.id || 'unknown-id' })
    } catch (err) {
      return e.badRequestError(err.message || 'Erro interno ao enviar email.')
    }
  },
  $apis.requireAuth(),
)
