import groupsYml from '../../groups.yml?raw';
import { parse } from 'yaml';
import data from '../data/events.json';
import history from '../data/past.json';
import headlines from '../data/news.json';

export interface Group {
  id: string; name: string; about: string; url?: string;
  meetup?: string; eventbrite?: string; ical?: string;
  match?: string; tags?: string; runs?: string; retired?: boolean;
}
export interface Event {
  uid: string; group: string; title: string; start: string; end: string;
  url?: string; venue?: string; address?: string; summary?: string;
  series?: boolean; seen?: string;
  host?: string; // set on events approved from the candidates issue, which have no group here
}

export const TZ = 'Europe/London';
export const SITE = 'https://www.yorkdevelopers.org';
export const groups: Group[] = parse(groupsYml);
export const fetchedAt: string = data.fetchedAt;

// Events are current until they end. The page also re-checks this in the browser.
export const upcoming = (): Event[] =>
  (data.events as Event[]).filter(e => Date.parse(e.end) > Date.now());

// Finished one-off events, newest first. Weekly regulars are left out.
export const previously = (n: number): Event[] =>
  (history.events as Event[]).filter(e => !e.series).reverse().slice(0, n);

export const groupById = (id: string): Group => groups.find(g => g.id === id) ?? { id, name: id, about: '' };

// Who is running an event: its group, or the organiser named when it was discovered.
export const hostName = (e: Event) => e.host ?? groupById(e.group).name;

export interface Headline { title: string; url: string; date: string; source: string; }
export const news: Headline[] = headlines.items;

export const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: TZ, ...opts }).format(new Date(iso));

// The calendar day in York, as YYYY-MM-DD.
export const dayKey = (iso: string) => fmt(iso, { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');

export const place = (e: Event) => [e.venue, e.address].filter(Boolean).join(', ');
export const mapLink = (e: Event) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place(e) + ', York')}`;

// A file-safe name for one event's own calendar file.
export const slug = (e: Event) => e.uid.replace(/@.*$/, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();

const stamp = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d+/, '');
const esc = (s = '') => s.replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');
// Lines over 75 bytes must be folded.
const fold = (line: string) => line.match(/.{1,70}/gu)!.join('\r\n ');

export function calendar(events: Event[]) {
  const now = stamp(new Date().toISOString());
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//yorkdevelopers.org//York tech events//EN',
    'CALSCALE:GREGORIAN', 'X-WR-CALNAME:York tech events',
    ...events.flatMap(e => [
      'BEGIN:VEVENT', `UID:${e.uid}`, `DTSTAMP:${now}`, `DTSTART:${stamp(e.start)}`, `DTEND:${stamp(e.end)}`,
      `SUMMARY:${esc(`${e.title} (${hostName(e)})`)}`,
      `LOCATION:${esc(place(e))}`, `DESCRIPTION:${esc(e.summary)}`, `URL:${e.url ?? ''}`, 'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ];
  return new Response(lines.map(fold).join('\r\n') + '\r\n', { headers: { 'content-type': 'text/calendar; charset=utf-8' } });
}
