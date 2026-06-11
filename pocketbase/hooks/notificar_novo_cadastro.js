// @deps resend@4.1.2
routerAdd(
  'POST',
  '/backend/v1/notificar-novo-cadastro',
  async (e) => {
    const { Resend } = require('resend')

    const apiKey = $secrets.get('RESEND_API_KEY')
    const destinatario = $secrets.get('EMAIL_DESTINATARIO')

    if (!apiKey || !destinatario) {
      return e.internalServerError(
        'Configurações de email (RESEND_API_KEY ou EMAIL_DESTINATARIO) ausentes no cofre de segredos.',
      )
    }

    const resend = new Resend(apiKey)
    const body = e.requestInfo().body || {}
    const { nome, email, retryId } = body

    if (!nome || !email) {
      return e.badRequestError('Nome e email são obrigatórios.')
    }

    const idempotencyKey = retryId ? `novo-cadastro/${email}/${retryId}` : `novo-cadastro/${email}`
    const dateStr = new Date().toLocaleString('pt-BR')

    const { data, error } = await resend.emails.send({
      from: 'Sistema de Cadastros <noreply@cubeia.com.br>',
      to: [destinatario],
      replyTo: email,
      subject: 'Novo Usuário Cadastrado',
      html: `<p>Um novo usuário foi cadastrado.</p>
           <p><strong>Nome:</strong> ${nome}</p>
           <p><strong>Email:</strong> ${email}</p>
           <p><strong>Data:</strong> ${dateStr}</p>`,
      tags: [{ name: 'category', value: 'novo-cadastro' }],
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    })

    if (error) {
      return e.json(error.statusCode || 500, error)
    }

    return e.json(200, { id: data.id })
  },
  $apis.requireAuth(),
)
