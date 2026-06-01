migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('google_access_token')) {
      users.fields.add(new TextField({ name: 'google_access_token' }))
    }
    if (!users.fields.getByName('google_refresh_token')) {
      users.fields.add(new TextField({ name: 'google_refresh_token' }))
    }
    if (!users.fields.getByName('google_token_expiry')) {
      users.fields.add(new NumberField({ name: 'google_token_expiry' }))
    }
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('google_access_token')
    users.fields.removeByName('google_refresh_token')
    users.fields.removeByName('google_token_expiry')
    app.save(users)
  },
)
