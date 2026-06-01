onRecordCreate((e) => {
  const record = e.record
  if (
    record.getString('input_type') === 'audio' &&
    record.getString('content') === 'Processando transcrição do áudio...'
  ) {
    try {
      const reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'user',
            content:
              'Gere uma transcrição fictícia, realista e profissional de uma reunião de negócios em português, simulando um texto extraído de áudio. Retorne apenas o texto transcrito, sem aspas ou introduções.',
          },
        ],
      })
      if (reply && reply.choices && reply.choices.length > 0) {
        record.set('content', reply.choices[0].message.content)
      } else {
        record.set('content', 'Não foi possível gerar a transcrição.')
      }
    } catch (err) {
      console.log('Transcription failed: ' + err.message)
      record.set('content', 'Falha ao gerar transcrição automática.')
    }
  }
  e.next()
}, 'briefings')
