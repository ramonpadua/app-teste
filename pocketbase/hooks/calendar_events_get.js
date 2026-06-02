routerAdd(
  'GET',
  '/backend/v1/calendar/events',
  (e) => {
    const userId = e.auth?.id
    if (!userId) return e.unauthorizedError('auth required')

    let user
    try {
      user = $app.findRecordById('users', userId)
    } catch (err) {
      return e.json(200, { items: [], google_sync: false, error_message: 'User not found' })
    }

    let accessToken = user.getString('google_access_token')
    let refreshToken = user.getString('google_refresh_token')
    let expiry = user.getInt('google_token_expiry')

    let googleSync = !!accessToken
    let authError = false
    let missingCalendar = false

    let lastApiRequest = null
    let lastApiResponse = null

    if (googleSync && Date.now() >= expiry - 60000) {
      const clientId = $secrets.get('ID_CLIENTE')
      const clientSecret = $secrets.get('CLIENT_SECRET')
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
            user.set('google_access_token', accessToken)
            user.set('google_token_expiry', expiry)
            try {
              $app.save(user)
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

    let tokenScopes = ''

    if (googleSync && accessToken) {
      try {
        const tokenInfoRes = $http.send({
          url: `https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`,
          method: 'GET',
          timeout: 15,
        })
        if (tokenInfoRes.statusCode === 200) {
          tokenScopes = tokenInfoRes.json.scope || ''
        }
      } catch (_) {}
    }

    if (googleSync) {
      try {
        lastApiRequest = 'GET https://www.googleapis.com/calendar/v3/users/me/calendarList'
        const calRes = $http.send({
          url: 'https://www.googleapis.com/calendar/v3/users/me/calendarList',
          method: 'GET',
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 15,
        })
        lastApiResponse = calRes.json

        if (calRes.statusCode === 200) {
          let calendars = calRes.json.items || []
          let targetCalendar = calendars.find((c) => c.summary === 'Ramon Pádua')

          if (!targetCalendar) {
            missingCalendar = true
          } else {
            const now = new Date()
            const timeMinDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            const timeMaxDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
            const timeMin = timeMinDate.toISOString()
            const timeMax = timeMaxDate.toISOString()

            const collection = $app.findCollectionByNameOrId('calendar_events')

            const calId = targetCalendar.id
            let pageToken = ''
            let pagesFetched = 0

            do {
              const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=250&showDeleted=true${pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : ''}`

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
                    let endStr = new Date(
                      ge.end?.dateTime || ge.end?.date || startStr,
                    ).toISOString()
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
                    if (existing.getString('calendar_id') !== calId) {
                      existing.set('calendar_id', calId)
                      changed = true
                    }
                    if (changed) $app.save(existing)
                  } catch (_) {
                    if (ge.status === 'cancelled') continue
                    if (!ge.start || (!ge.start.dateTime && !ge.start.date)) continue

                    let startStr = new Date(
                      ge.start.dateTime || ge.start.date + 'T00:00:00Z',
                    ).toISOString()
                    let endStr = new Date(
                      ge.end?.dateTime || ge.end?.date || startStr,
                    ).toISOString()
                    let title = ge.summary || 'Sem título'
                    let desc = ge.description || ''

                    const rec = new Record(collection)
                    rec.set('event_id', ge.id)
                    rec.set('title', title)
                    rec.set('description', desc)
                    rec.set('start_date', startStr)
                    rec.set('end_date', endStr)
                    rec.set('calendar_id', calId)
                    rec.set('user', userId)
                    try {
                      $app.save(rec)
                    } catch (err) {}
                  }
                }

                pageToken = res.json.nextPageToken
                pagesFetched++
              } else if (res.statusCode === 401 || res.statusCode === 403) {
                googleSync = false
                authError = true
                break
              } else {
                break
              }
            } while (pageToken && pagesFetched < 5)
          }
        } else if (calRes.statusCode === 401 || calRes.statusCode === 403) {
          googleSync = false
          authError = true
        }
      } catch (_) {
        googleSync = false
      }
    }

    if (authError) {
      user.set('google_access_token', '')
      user.set('google_refresh_token', '')
      user.set('google_token_expiry', 0)
      try {
        $app.save(user)
      } catch (_) {}
    }

    try {
      const records = $app.findRecordsByFilter(
        'calendar_events',
        `user = '${userId}'`,
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

      let errorMessage = null
      if (missingCalendar) {
        errorMessage = "Calendar 'Ramon Pádua' not found"
      }

      return e.json(200, {
        items,
        google_sync: googleSync,
        auth_error: authError,
        missing_calendar: missingCalendar,
        error_message: errorMessage,
        debug_trace: {
          last_request: lastApiRequest,
          last_response: lastApiResponse,
          token_scopes: tokenScopes,
        },
      })
    } catch (err) {
      return e.json(200, {
        items: [],
        google_sync: googleSync,
        auth_error: authError,
        missing_calendar: missingCalendar,
        error_message: 'Error fetching records',
        debug_trace: {
          last_request: lastApiRequest,
          last_response: lastApiResponse,
          token_scopes: tokenScopes,
        },
      })
    }
  },
  $apis.requireAuth(),
)
