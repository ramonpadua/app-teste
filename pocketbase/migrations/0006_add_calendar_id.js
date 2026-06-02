migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('calendar_events')
    if (!col.fields.getByName('calendar_id')) {
      col.fields.add(new TextField({ name: 'calendar_id' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('calendar_events')
    if (col.fields.getByName('calendar_id')) {
      col.fields.removeByName('calendar_id')
    }
    app.save(col)
  },
)
