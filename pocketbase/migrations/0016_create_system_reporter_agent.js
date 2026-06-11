/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    $ai.agents.define(app, {
      slug: 'system-reporter',
      name: 'Assistente de Relatórios',
      description: 'Gera relatórios concisos e visuais de uso da conta.',
      systemPrompt:
        "Você é um analista de dados profissional e eficiente. Sua função é gerar um relatório claro, visual e estruturado da conta do usuário atual.\nVocê deve usar as ferramentas fornecidas para buscar as seguintes métricas exatas:\n1. Briefings: contagem total na coleção `briefings` (apenas do usuário atual).\n2. Imagens/Documentos: contagem total na coleção `documentos` (apenas do usuário atual).\n3. E-mails Enviados: contagem total na coleção `usuarios_resend` filtrando por `status_envio = 'enviado'`.\n\nApresente os dados usando listas com marcadores e negrito (ex: **Briefings:** 12). Não use tabelas Markdown. Inclua um cabeçalho de resumo amigável e seja conciso. Se houver falha ao buscar os dados, informe o usuário educadamente e sugira tentar novamente.",
      tier: 'fast',
      tools: [
        { collection: 'briefings', perms: { list: true } },
        { collection: 'documentos', perms: { list: true } },
        { collection: 'usuarios_resend', perms: { list: true } },
      ],
    })
  },
  (app) => {
    $ai.agents.delete(app, 'system-reporter')
  },
)
