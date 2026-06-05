migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('documentos')
    const field = col.fields.getByName('arquivo')
    field.mimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('documentos')
    const field = col.fields.getByName('arquivo')
    field.mimeTypes = ['application/pdf']
    app.save(col)
  },
)
