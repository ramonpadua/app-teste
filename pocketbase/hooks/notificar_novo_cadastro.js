routerAdd(
  'POST',
  '/backend/v1/notificar-novo-cadastro',
  (e) => {
    const apiKey = $secrets.get('RESEND_API_KEY')
    const destinatario = $secrets.get('EMAIL_DESTINATARIO')

    if (!apiKey || !destinatario) {
      return e.internalServerError(
        'Configurações de email (RESEND_API_KEY ou EMAIL_DESTINATARIO) ausentes no cofre de segredos.',
      )
    }

    const body = e.requestInfo().body || {}
    const { nome, email, retryId } = body

    if (!nome || !email) {
      return e.badRequestError('Nome e email são obrigatórios.')
    }

    const idempotencyKey = retryId ? `novo-cadastro/${email}/${retryId}` : `novo-cadastro/${email}`
    // Usa timezone explícito ou deixa para o formato local
    const dateStr = new Date().toLocaleString('pt-BR')

    const res = $http.send({
      url: 'https://api.resend.com/emails',
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        from: 'Sistema de Cadastros <noreply@cubeia.com.br>',
        to: [destinatario],
        reply_to: email,
        subject: 'Novo Usuário Cadastrado',
        html: `<p>Um novo usuário foi cadastrado.</p>
             <p><strong>Nome:</strong> ${nome}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Data:</strong> ${dateStr}</p>`,
        tags: [{ name: 'category', value: 'novo-cadastro' }],
      }),
      timeout: 15,
    })

    if (res.statusCode >= 400) {
      return e.json(
        res.statusCode,
        res.json || { message: 'Erro ao enviar email', status: res.statusCode },
      )
    }

    return e.json(200, { id: res.json?.id || 'enviado' })
  },
  $apis.requireAuth(),
)
