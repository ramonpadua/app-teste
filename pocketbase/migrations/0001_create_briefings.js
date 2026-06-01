migrate(
  (app) => {
    const collection = new Collection({
      name: 'briefings',
      type: 'base',
      listRule: "@request.auth.id != '' && user = @request.auth.id",
      viewRule: "@request.auth.id != '' && user = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'meeting_date', type: 'date', required: true },
        { name: 'content', type: 'text', required: true },
        {
          name: 'input_type',
          type: 'select',
          required: true,
          values: ['text', 'audio'],
          maxSelect: 1,
        },
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_briefings_user ON briefings (user)',
        'CREATE INDEX idx_briefings_date ON briefings (meeting_date DESC)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('briefings')
    app.delete(collection)
  },
)
