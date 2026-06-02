routerAdd(
  'GET',
  '/backend/v1/calendar/events',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    let tokenRecord
    try {
      tokenRecord = $app.findFirstRecordByData('google_tokens', 'user', userId)
    } catch (err) {
      $app.logger().info('Calendar not connected', 'user_id', userId)
      return e.json(200, { items: [], google_sync: false, error_message: 'Calendar not connected' })
    }

    let accessToken = tokenRecord.getString('access_token')
    let refreshToken = tokenRecord.getString('refresh_token')
    let expiry = tokenRecord.getInt('expires_at')
    let scope = tokenRecord.getString('scope')

    if (!scope.includes('calendar.readonly')) {
      try {
        $app.delete(tokenRecord)
      } catch (_) {}
      return e.json(200, {
        items: [],
        google_sync: false,
        auth_error: true,
        error_message: 'Insufficient scope. Re-consent required.',
      })
    }

    let googleSync = !!accessToken
    let authError = false

    let lastApiRequest = null
    let lastApiResponse = null

    if (googleSync && Date.now() >= expiry - 60000) {
      const clientId = $secrets.get('GOOGLE_CLIENT_ID') || $secrets.get('ID_CLIENTE')
      const clientSecret = $secrets.get('GOOGLE_CLIENT_SECRET') || $secrets.get('CLIENT_SECRET')
      if (clientId && clientSecret && refreshToken) {
        const reqBody = `client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&refresh_token=${encodeURIComponent(refreshToken)}&grant_type=refresh_token`
        lastApiRequest = 'POST https://oauth2.googleapis.com/token'

        try {
          const res = $http.send({
            url: 'https://oauth2.googleapis.com/token',
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: reqBody,
            timeout: 15,
          })
          lastApiResponse = res.json

          if (res.statusCode === 200 && res.json.access_token) {
            accessToken = res.json.access_token
            expiry = Date.now() + res.json.expires_in * 1000
            tokenRecord.set('access_token', accessToken)
            tokenRecord.set('expires_at', expiry)
            if (res.json.scope) tokenRecord.set('scope', res.json.scope)
            if (res.json.refresh_token) {
              refreshToken = res.json.refresh_token
              tokenRecord.set('refresh_token', refreshToken)
            }
            try {
              $app.save(tokenRecord)
            } catch (_) {}
          } else {
            googleSync = false
            authError = true
          }
        } catch (_) {
          googleSync = false
          authError = true
        }
      } else {
        googleSync = false
        authError = true
      }
    }

    if (googleSync) {
      try {
        const now = new Date()
        const timeMinDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const timeMaxDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
        const timeMin = timeMinDate.toISOString()
        const timeMax = timeMaxDate.toISOString()

        const collection = $app.findCollectionByNameOrId('calendar_events')
        let pageToken = ''
        let pagesFetched = 0
        let retries = 0

        do {
          const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=250&showDeleted=true${pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : ''}`

          lastApiRequest = 'GET ' + url
          const res = $http.send({
            url,
            method: 'GET',
            headers: { Authorization: `Bearer ${accessToken}` },
            timeout: 30,
          })
          lastApiResponse = res.json

          if (res.statusCode === 200) {
            const gEvents = res.json.items || []
            for (const ge of gEvents) {
              try {
                const existing = $app.findFirstRecordByFilter(
                  'calendar_events',
                  `user = '${userId}' && event_id = '${ge.id}'`,
                )

                if (ge.status === 'cancelled') {
                  try {
                    $app.delete(existing)
                  } catch (e) {}
                  continue
                }

                if (!ge.start || (!ge.start.dateTime && !ge.start.date)) continue

                let startStr = new Date(
                  ge.start.dateTime || ge.start.date + 'T00:00:00Z',
                ).toISOString()
                let endStr = new Date(ge.end?.dateTime || ge.end?.date || startStr).toISOString()
                let title = ge.summary || 'Sem título'
                let desc = ge.description || ''

                let changed = false
                if (existing.getString('title') !== title) {
                  existing.set('title', title)
                  changed = true
                }
                if (existing.getString('description') !== desc) {
                  existing.set('description', desc)
                  changed = true
                }
                if (existing.getString('start_date') !== startStr) {
                  existing.set('start_date', startStr)
                  changed = true
                }
                if (existing.getString('end_date') !== endStr) {
                  existing.set('end_date', endStr)
                  changed = true
                }
                if (existing.getString('calendar_id') !== 'primary') {
                  existing.set('calendar_id', 'primary')
                  changed = true
                }
                if (changed) $app.save(existing)
              } catch (_) {
                if (ge.status === 'cancelled') continue
                if (!ge.start || (!ge.start.dateTime && !ge.start.date)) continue

                let startStr = new Date(
                  ge.start.dateTime || ge.start.date + 'T00:00:00Z',
                ).toISOString()
                let endStr = new Date(ge.end?.dateTime || ge.end?.date || startStr).toISOString()
                let title = ge.summary || 'Sem título'
                let desc = ge.description || ''

                const rec = new Record(collection)
                rec.set('event_id', ge.id)
                rec.set('title', title)
                rec.set('description', desc)
                rec.set('start_date', startStr)
                rec.set('end_date', endStr)
                rec.set('calendar_id', 'primary')
                rec.set('user', userId)
                try {
                  $app.save(rec)
                } catch (err) {}
              }
            }

            pageToken = res.json.nextPageToken
            pagesFetched++
            retries = 0
          } else if (res.statusCode === 429 && retries < 3) {
            retries++
            const delay = Math.pow(2, retries) * 500
            const end = Date.now() + delay
            while (Date.now() < end) {}
            continue
          } else if (res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 400) {
            googleSync = false
            authError = true
            break
          } else {
            break
          }
        } while (pageToken && pagesFetched < 5)
      } catch (_) {
        googleSync = false
      }
    }

    if (authError) {
      try {
        $app.delete(tokenRecord)
      } catch (_) {}
    }

    try {
      const records = $app.findRecordsByFilter(
        'calendar_events',
        `user = '${userId}' && calendar_id = 'primary'`,
        '-start_date',
        2500,
        0,
      )
      const items = records.map((r) => ({
        id: r.id,
        event_id: r.getString('event_id'),
        title: r.getString('title'),
        description: r.getString('description'),
        start_date: r.getString('start_date'),
        end_date: r.getString('end_date'),
        calendar_id: r.getString('calendar_id'),
      }))

      return e.json(200, {
        items,
        google_sync: googleSync,
        auth_error: authError,
        error_message: authError ? 'Authentication error with Google. Please reconnect.' : null,
        debug_trace: {
          last_request: lastApiRequest,
          last_response: lastApiResponse,
        },
      })
    } catch (err) {
      return e.json(200, {
        items: [],
        google_sync: googleSync,
        auth_error: authError,
        error_message: 'Error fetching records',
        debug_trace: {
          last_request: lastApiRequest,
          last_response: lastApiResponse,
        },
      })
    }
  },
  $apis.requireAuth(),
)
