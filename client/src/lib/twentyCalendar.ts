/**
 * Twenty CRM Calendar API Client
 * PRIMARY scheduling source - creates events directly in Twenty CRM
 * Auto-syncs with Google Calendar via Twenty's native integration
 */

import { getSettings, getTwentyCrmUrl } from './settings';

export interface CalendarEvent {
  id?: string;
  title: string;
  startsAt: string;
  endsAt: string;
  description?: string;
  location?: string;
  isFullDay?: boolean;
  isCanceled?: boolean;
}

export interface CreateAppointmentParams {
  leadId: string;
  leadName: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:mm
  durationMinutes?: number;
  type: 'phone_call' | 'site_visit' | 'virtual_meeting';
  notes?: string;
  location?: string;
}

const TYPE_LABELS: Record<string, string> = {
  phone_call: '📞 Phone Call',
  site_visit: '🏠 Site Visit',
  virtual_meeting: '💻 Virtual Meeting',
};

function getHeaders(): Record<string, string> {
  const settings = getSettings();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${settings.twentyApiKey}`,
  };
}

/**
 * Create a calendar event directly in Twenty CRM
 */
export async function createCalendarEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
  const response = await fetch(`${getTwentyCrmUrl()}/rest/calendarEvents`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      title: event.title,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      description: event.description || '',
      location: event.location || '',
      isFullDay: event.isFullDay || false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create calendar event: ${error}`);
  }

  const result = await response.json();
  return result.data?.createCalendarEvent || result;
}

/**
 * Link a calendar event to a person (lead) as participant
 */
export async function addEventParticipant(
  calendarEventId: string,
  personId: string
): Promise<void> {
  const response = await fetch(`${getTwentyCrmUrl()}/rest/calendarEventParticipants`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ calendarEventId, personId }),
  });

  if (!response.ok) {
    console.warn('Failed to add participant to calendar event');
  }
}

/**
 * Create appointment with lead - full workflow
 * This is the PRIMARY scheduling function
 */
export async function createAppointment(params: CreateAppointmentParams): Promise<CalendarEvent> {
  const { leadId, leadName, date, time, durationMinutes = 60, type, notes, location } = params;

  // Build ISO timestamps
  const startDateTime = new Date(`${date}T${time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

  const title = `${TYPE_LABELS[type] || type}: ${leadName}`;

  let description = notes || '';
  description += `\n\n---\nType: ${type.replace('_', ' ')}\nLead: ${leadName}\nScheduled via ADS Dashboard`;

  // Determine location based on type
  let eventLocation = location || '';
  if (!eventLocation) {
    switch (type) {
      case 'phone_call': eventLocation = 'Phone'; break;
      case 'virtual_meeting': eventLocation = 'Virtual (Zoom/Teams)'; break;
      case 'site_visit': eventLocation = 'Lead Address (see CRM)'; break;
    }
  }

  // 1. Create the calendar event
  const event = await createCalendarEvent({
    title,
    startsAt: startDateTime.toISOString(),
    endsAt: endDateTime.toISOString(),
    description,
    location: eventLocation,
  });

  // 2. Link the lead as participant (if valid Twenty person ID)
  if (leadId && leadId !== 'quick-schedule' && event.id) {
    try {
      await addEventParticipant(event.id, leadId);
    } catch (e) {
      console.warn('Could not link lead to calendar event:', e);
    }
  }

  return event;
}

/**
 * Get upcoming calendar events from Twenty CRM
 */
export async function getUpcomingEvents(limit = 10): Promise<CalendarEvent[]> {
  const settings = getSettings();
  if (!settings.twentyApiKey) return [];

  try {
    const response = await fetch(
      `${getTwentyCrmUrl()}/rest/calendarEvents?limit=${limit}`,
      { method: 'GET', headers: getHeaders() }
    );

    if (!response.ok) return [];

    const result = await response.json();
    const events = result.data?.calendarEvents || result.data || [];

    // Filter to future events and sort by date
    const now = new Date();
    return events
      .filter((e: CalendarEvent) => new Date(e.startsAt) >= now && !e.isCanceled)
      .sort((a: CalendarEvent, b: CalendarEvent) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      );
  } catch {
    return [];
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  const response = await fetch(`${getTwentyCrmUrl()}/rest/calendarEvents/${eventId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return response.ok;
}
