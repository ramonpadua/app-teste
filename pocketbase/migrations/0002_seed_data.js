migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    let user
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'ramon.padua@adapta.org')
    } catch (_) {
      user = new Record(users)
      user.setEmail('ramon.padua@adapta.org')
      user.setPassword('Skip@Pass')
      user.setVerified(true)
      user.set('name', 'Ramon')
      app.save(user)
    }

    const briefings = app.findCollectionByNameOrId('briefings')

    const seedData = [
      {
        title: 'Project Kickoff',
        meeting_date:
          new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            .toISOString()
            .replace('T', ' ')
            .substring(0, 19) + 'Z',
        content:
          'Nesta reunião, a equipe discutiu os objetivos principais para o Q3. Focaremos na melhoria da experiência de onboarding e na introdução de novas integrações de API. A prioridade máxima é resolver os gargalos de desempenho relatados no Q2. Aprovamos o orçamento inicial para marketing digital.',
        input_type: 'text',
        user: user.id,
      },
      {
        title: 'Feedback de Design',
        meeting_date:
          new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            .toISOString()
            .replace('T', ' ')
            .substring(0, 19) + 'Z',
        content:
          'A equipe de design apresentou as novas propostas de cores. Acordamos em seguir com uma paleta mais sóbria e profissional (Slate/Zinc). O fluxo de onboarding foi simplificado de 5 para 3 etapas, reduzindo o atrito inicial. Precisamos de testes A/B na próxima semana.',
        input_type: 'text',
        user: user.id,
      },
      {
        title: 'Sync Semanal de Engenharia',
        meeting_date:
          new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            .toISOString()
            .replace('T', ' ')
            .substring(0, 19) + 'Z',
        content:
          'O time de backend confirmou que a nova API está 90% concluída. Faltam apenas os endpoints de relatórios. O bug de duplicação de registros foi identificado e corrigido no PR #432. A próxima sprint será focada em testes end-to-end e refatoração de código legado.',
        input_type: 'audio',
        user: user.id,
      },
    ]

    for (const data of seedData) {
      try {
        app.findFirstRecordByData('briefings', 'title', data.title)
      } catch (_) {
        const record = new Record(briefings)
        record.set('title', data.title)
        record.set('meeting_date', data.meeting_date)
        record.set('content', data.content)
        record.set('input_type', data.input_type)
        record.set('user', data.user)
        app.save(record)
      }
    }
  },
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'ramon.padua@adapta.org')
      const records = app.findRecordsByFilter('briefings', `user = '${user.id}'`, '', 100, 0)
      for (const record of records) {
        app.delete(record)
      }
    } catch (_) {}
  },
)
