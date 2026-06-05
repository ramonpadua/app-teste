migrate(
  (app) => {
    const usersColId = '_pb_users_auth_'

    // 1. whatsapp_instances
    const instancesCol = new Collection({
      name: 'whatsapp_instances',
      type: 'base',
      listRule: "@request.auth.id != '' && user = @request.auth.id",
      viewRule: "@request.auth.id != '' && user = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          maxSelect: 1,
          collectionId: usersColId,
          cascadeDelete: true,
        },
        { name: 'instance_name', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['disconnected', 'connected'],
          maxSelect: 1,
        },
        { name: 'qr_code', type: 'text' },
        { name: 'phone_number', type: 'text' },
        { name: 'profile_name', type: 'text' },
        { name: 'profile_picture_url', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_whatsapp_instances_name ON whatsapp_instances (instance_name)',
      ],
    })
    app.save(instancesCol)

    const instancesColId = app.findCollectionByNameOrId('whatsapp_instances').id

    // 2. whatsapp_contacts
    const contactsCol = new Collection({
      name: 'whatsapp_contacts',
      type: 'base',
      listRule: "@request.auth.id != '' && instance.user = @request.auth.id",
      viewRule: "@request.auth.id != '' && instance.user = @request.auth.id",
      createRule: "@request.auth.id != '' && instance.user = @request.auth.id",
      updateRule: "@request.auth.id != '' && instance.user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && instance.user = @request.auth.id",
      fields: [
        {
          name: 'instance',
          type: 'relation',
          required: true,
          maxSelect: 1,
          collectionId: instancesColId,
          cascadeDelete: true,
        },
        { name: 'remote_jid', type: 'text', required: true },
        { name: 'push_name', type: 'text' },
        { name: 'profile_picture_url', type: 'text' },
        { name: 'is_business', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_wa_contacts_instance_jid ON whatsapp_contacts (instance, remote_jid)',
      ],
    })
    app.save(contactsCol)

    // 3. whatsapp_chats
    const chatsCol = new Collection({
      name: 'whatsapp_chats',
      type: 'base',
      listRule: "@request.auth.id != '' && instance.user = @request.auth.id",
      viewRule: "@request.auth.id != '' && instance.user = @request.auth.id",
      createRule: "@request.auth.id != '' && instance.user = @request.auth.id",
      updateRule: "@request.auth.id != '' && instance.user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && instance.user = @request.auth.id",
      fields: [
        {
          name: 'instance',
          type: 'relation',
          required: true,
          maxSelect: 1,
          collectionId: instancesColId,
          cascadeDelete: true,
        },
        { name: 'remote_jid', type: 'text', required: true },
        { name: 'name', type: 'text' },
        { name: 'is_group', type: 'bool' },
        { name: 'unread_count', type: 'number' },
        { name: 'last_message_text', type: 'text' },
        { name: 'last_message_timestamp', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_wa_chats_instance_jid ON whatsapp_chats (instance, remote_jid)',
        'CREATE INDEX idx_wa_chats_instance_time ON whatsapp_chats (instance, last_message_timestamp DESC)',
      ],
    })
    app.save(chatsCol)

    const chatsColId = app.findCollectionByNameOrId('whatsapp_chats').id

    // 4. whatsapp_messages
    const messagesCol = new Collection({
      name: 'whatsapp_messages',
      type: 'base',
      listRule: "@request.auth.id != '' && instance.user = @request.auth.id",
      viewRule: "@request.auth.id != '' && instance.user = @request.auth.id",
      createRule: "@request.auth.id != '' && instance.user = @request.auth.id",
      updateRule: "@request.auth.id != '' && instance.user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && instance.user = @request.auth.id",
      fields: [
        {
          name: 'instance',
          type: 'relation',
          required: true,
          maxSelect: 1,
          collectionId: instancesColId,
          cascadeDelete: true,
        },
        {
          name: 'chat',
          type: 'relation',
          required: true,
          maxSelect: 1,
          collectionId: chatsColId,
          cascadeDelete: true,
        },
        { name: 'message_id', type: 'text', required: true },
        { name: 'remote_jid', type: 'text', required: true },
        { name: 'from_me', type: 'bool' },
        { name: 'sender_jid', type: 'text' },
        { name: 'message_type', type: 'text' },
        { name: 'content', type: 'text' },
        { name: 'media_url', type: 'text' },
        { name: 'timestamp', type: 'date', required: true },
        { name: 'status', type: 'text' },
        { name: 'raw_payload', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_wa_msg_instance_id ON whatsapp_messages (instance, message_id)',
        'CREATE INDEX idx_wa_msg_chat_time ON whatsapp_messages (chat, timestamp DESC)',
      ],
    })
    app.save(messagesCol)
  },
  (app) => {
    const collections = [
      'whatsapp_messages',
      'whatsapp_chats',
      'whatsapp_contacts',
      'whatsapp_instances',
    ]
    for (const name of collections) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
  },
)
