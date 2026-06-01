routerAdd(
  'POST',
  '/backend/v1/transcrever',
  (e) => {
    const b64ToByteArray = (b64) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
      const lookup = new Uint8Array(256)
      for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i
      lookup[45] = 62
      lookup[95] = 63
      let len = b64.length
      let bufferLength = len * 0.75
      if (b64[len - 1] === '=') bufferLength--
      if (b64[len - 2] === '=') bufferLength--
      const bytes = new Uint8Array(bufferLength)
      let p = 0
      for (let i = 0; i < len; i += 4) {
        let e1 = lookup[b64.charCodeAt(i)]
        let e2 = lookup[b64.charCodeAt(i + 1)]
        let e3 = lookup[b64.charCodeAt(i + 2)]
        let e4 = lookup[b64.charCodeAt(i + 3)]
        bytes[p++] = (e1 << 2) | (e2 >> 4)
        if (b64.charCodeAt(i + 2) !== 61) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2)
        if (b64.charCodeAt(i + 3) !== 61) bytes[p++] = ((e3 & 3) << 6) | (e4 & 63)
      }
      return bytes
    }

    const files = e.findUploadedFiles('audio')
    if (!files || files.length === 0) {
      return e.badRequestError('Nenhum arquivo de áudio fornecido.')
    }

    const body = e.requestInfo().body || {}
    const base64Data = body.audio_base64
    if (!base64Data) {
      return e.badRequestError('Dados do áudio ausentes.')
    }

    // 25MB check approx
    if (base64Data.length > 35000000) {
      return e.badRequestError('O arquivo excede o limite de 25MB.')
    }

    const name = String(body.filename || 'audio.webm').toLowerCase()
    const allowed = ['.webm', '.mp3', '.mp4', '.m4a', '.wav', '.mpeg', '.mpga']
    if (!allowed.some((ext) => name.endsWith(ext))) {
      return e.badRequestError('Formato de áudio não suportado.')
    }

    try {
      const bytes = b64ToByteArray(base64Data)
      const boundary = '----WebKitFormBoundary' + $security.randomString(16)

      const strToUTF8 = (str) => {
        let utf8 = unescape(encodeURIComponent(str))
        let arr = new Uint8Array(utf8.length)
        for (let i = 0; i < utf8.length; i++) {
          arr[i] = utf8.charCodeAt(i)
        }
        return arr
      }

      const part1 = strToUTF8(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="file"; filename="${name}"\r\n` +
          `Content-Type: application/octet-stream\r\n\r\n`,
      )
      const part2 = bytes
      const part3 = strToUTF8(
        `\r\n--${boundary}\r\n` +
          `Content-Disposition: form-data; name="model"\r\n\r\n` +
          `gpt-4o-transcribe\r\n` +
          `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="response_format"\r\n\r\n` +
          `text\r\n` +
          `--${boundary}--\r\n`,
      )

      const payload = new Uint8Array(part1.length + part2.length + part3.length)
      payload.set(part1, 0)
      payload.set(part2, part1.length)
      payload.set(part3, part1.length + part2.length)

      const apiKey = $secrets.get('API_GPT')
      if (!apiKey) {
        return e.internalServerError('Configuração da API ausente.')
      }

      const res = $http.send({
        url: 'https://api.openai.com/v1/audio/transcriptions',
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + apiKey,
          'Content-Type': 'multipart/form-data; boundary=' + boundary,
        },
        body: payload,
        timeout: 120,
      })

      if (res.statusCode !== 200) {
        let errBody = ''
        if (res.body) {
          let str = ''
          for (let i = 0; i < res.body.length; i++) {
            str += String.fromCharCode(res.body[i])
          }
          errBody = str
        }
        $app
          .logger()
          .error('OpenAI transcription failed', 'status', res.statusCode, 'response', errBody)
        return e.internalServerError('Falha na comunicação com o serviço de transcrição.')
      }

      let textResult = ''
      if (res.body) {
        let str = ''
        for (let i = 0; i < res.body.length; i++) {
          str += String.fromCharCode(res.body[i])
        }
        try {
          textResult = decodeURIComponent(escape(str))
        } catch (_) {
          textResult = str
        }
      }

      return e.json(200, { text: textResult.trim() })
    } catch (err) {
      $app.logger().error('Transcription hook error', 'error', err.message)
      return e.internalServerError('Erro interno ao transcrever.')
    }
  },
  $apis.requireAuth(),
)
