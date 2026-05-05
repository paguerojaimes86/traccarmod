/**
 * Genera un archivo iCalendar (ICS) en base64 a partir de parámetros simples.
 *
 * Formato: https://tools.ietf.org/html/rfc5545
 */

export type RecurrenceFreq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

interface GenerateIcsParams {
  summary: string;
  dtStart: string;   // ISO string o datetime-local value
  dtEnd: string;     // ISO string o datetime-local value
  freq?: RecurrenceFreq;
}

function toIcsDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

export function generateIcsBase64({ summary, dtStart, dtEnd, freq }: GenerateIcsParams): string {
  const now = toIcsDate(new Date().toISOString());

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Traccar//Calendar//ES',
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID()}@traccar`,
    `DTSTAMP:${now}`,
    `DTSTART:${toIcsDate(dtStart)}`,
    `DTEND:${toIcsDate(dtEnd)}`,
    `SUMMARY:${summary}`,
  ];

  if (freq) {
    lines.push(`RRULE:FREQ=${freq}`);
  }

  lines.push('END:VEVENT');
  lines.push('END:VCALENDAR');

  const ics = lines.join('\r\n');
  return btoa(ics);
}
