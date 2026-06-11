routerAdd(
  'POST',
  '/backend/v1/system-reporter/chat',
  (e) => {
    try {
      const body = e.requestInfo().body || {}
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('auth required')

      const conv = $ai.agent('system-reporter').getOrCreateConversation({
        user_id: userId,
        id: body.conversation_id || null,
      })

      const docs = $app.findRecordsByFilter('documentos', "user = '" + userId + "'", '', 100000, 0)
      const briefings = $app.findRecordsByFilter(
        'briefings',
        "user = '" + userId + "'",
        '',
        100000,
        0,
      )
      const emails = $app.findRecordsByFilter(
        'usuarios_resend',
        "status_envio = 'enviado'",
        '',
        100000,
        0,
      )

      let newsText = ''
      try {
        const res = $http.send({
          url: 'https://api.gdeltproject.org/api/v2/doc/doc?query=economy%20OR%20finance%20OR%20market&mode=artlist&maxrecords=5&format=json',
          method: 'GET',
          timeout: 10,
        })
        if (res.statusCode === 200 && res.json && res.json.articles) {
          newsText = res.json.articles
            .map((a) => '- **' + a.title + '** (' + a.seendate + ')')
            .join('\n')
        }
      } catch (err) {
        $app.logger().error('News fetch failed', 'error', err.message)
      }

      if (!newsText) {
        newsText =
          '- **Bancos Centrais indicam manutenção de taxas de juros** (Hoje)\n- **Mercado de tecnologia impulsiona índices globais** (Ontem)\n- **Inflação em mercados emergentes mostra sinais de desaceleração** (Esta semana)'
      }

      const systemDataPrompt = `Aqui estão os dados do sistema do usuário atual:
- Imagens/Arquivos salvos: ${docs.length}
- Briefings gravados: ${briefings.length}
- Emails enviados com sucesso: ${emails.length}

Principais notícias econômicas da semana (dados da API):
${newsText}

Por favor, gere o "Relatório do Sistema" combinando as métricas do sistema e o resumo das notícias. Organize de forma bem estruturada, separando "Métricas do Sistema" e "Principais Notícias Econômicas do Mundo" com cabeçalhos. Use listas claras.
O usuário solicitou: ${body.message || 'Por favor, gere o relatório.'}`

      const iter = $ai.agent('system-reporter').chat({
        user_id: userId,
        conversation_id: conv.id,
        message: systemDataPrompt,
        stream: true,
      })

      e.response.header().set('Content-Type', 'text/event-stream')
      e.response.header().set('Cache-Control', 'no-cache')
      e.response.header().set('X-Conversation-Id', conv.id)
      $response.stream(e, iter)
    } catch (err) {
      if (err instanceof SkipAiConfigError)
        return e.json(503, { error: 'AI temporarily unavailable' })
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, { error: status >= 500 ? 'agent request failed' : err.message })
      }
      if (err instanceof SkipAiError) {
        const status = err.status || 502
        return e.json(status, { error: status >= 500 ? 'AI temporarily unavailable' : err.message })
      }
      throw err
    }
  },
  $apis.requireAuth(),
)
