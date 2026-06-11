migrate(
  (app) => {
    let col
    try {
      col = app.findCollectionByNameOrId('usuarios_resend')
    } catch (err) {
      col = new Collection({
        name: 'usuarios_resend',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'nome', type: 'text', required: true },
          { name: 'email', type: 'email', required: true },
          {
            name: 'status_envio',
            type: 'select',
            required: false,
            values: ['pendente', 'enviado', 'falhou'],
          },
          { name: 'resend_email_id', type: 'text', required: false },
        ],
      })
      app.save(col)
      col.addIndex('idx_usuarios_resend_email', true, 'email', '')
      app.save(col)
      return
    }

    col.listRule = "@request.auth.id != ''"
    col.viewRule = "@request.auth.id != ''"
    col.createRule = "@request.auth.id != ''"
    col.updateRule = "@request.auth.id != ''"
    col.deleteRule = "@request.auth.id != ''"
    app.save(col)
  },
  (app) => {},
)
