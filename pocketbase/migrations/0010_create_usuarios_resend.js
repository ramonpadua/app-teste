migrate(
  (app) => {
    const collection = new Collection({
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
          maxSelect: 1,
        },
        { name: 'resend_email_id', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_usuarios_resend_email ON usuarios_resend (email)',
        'CREATE INDEX idx_usuarios_resend_status ON usuarios_resend (status_envio)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('usuarios_resend')
    app.delete(collection)
  },
)
