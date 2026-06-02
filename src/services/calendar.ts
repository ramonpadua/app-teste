import pb from '@/lib/pocketbase/client'

export interface CalendarEvent {
  id: string
  event_id: string
  title: string
  description: string
  start_date: string
  end_date: string
  calendar_id?: string
}

export interface GetEventsResponse {
  items: CalendarEvent[]
  google_sync: boolean
  auth_error?: boolean
  missing_calendar?: boolean
  error_message?: string | null
  debug_trace?: {
    last_request: string | null
    last_response: any | null
    token_scopes?: string
  }
}

export interface CalendarEventResponse extends CalendarEvent {
  google_success?: boolean
}

export const getEvents = () =>
  pb.send<GetEventsResponse>('/backend/v1/calendar/events', { method: 'GET' })

export const getCalendarAuthUrl = (redirectUri: string) =>
  pb.send<{ url: string }>(
    `/backend/v1/calendar/auth-url?redirect_uri=${encodeURIComponent(redirectUri)}`,
    { method: 'GET' },
  )

export const exchangeCalendarAuthCode = (code: string, redirectUri: string) =>
  pb.send<{ success: boolean }>('/backend/v1/calendar/callback', {
    method: 'POST',
    body: JSON.stringify({ code, redirect_uri: redirectUri }),
    headers: { 'Content-Type': 'application/json' },
  })

export const unlinkCalendar = () =>
  pb.send<{ success: boolean }>('/backend/v1/calendar/unlink', { method: 'POST' })
