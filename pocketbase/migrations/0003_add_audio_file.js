migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('briefings')
    if (!col.fields.getByName('audio_file')) {
      col.fields.add(
        new FileField({
          name: 'audio_file',
          maxSelect: 1,
          maxSize: 52428800,
          mimeTypes: [
            'audio/webm',
            'audio/mp3',
            'audio/mpeg',
            'audio/wav',
            'audio/ogg',
            'audio/mp4',
            'audio/x-m4a',
            'audio/aac',
          ],
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('briefings')
    const field = col.fields.getByName('audio_file')
    if (field) {
      col.fields.removeById(field.id)
      app.save(col)
    }
  },
)
