import groupsYml from '../../groups.yml?raw';
import { parse } from 'yaml';
import data from '../data/events.json';
import history from '../data/past.json';
import headlines from '../data/news.json';

export interface Group {
  id: string; name: string; about: string; url?: string;
  meetup?: string; eventbrite?: string; ical?: string;
  match?: string; tags?: string; icon?: string; runs?: string; retired?: boolean;
}
export interface Event {
  uid: string; group: string; title: string; start: string; end: string;
  url?: string; venue?: string; address?: string; summary?: string;
  series?: boolean; seen?: string;
  with?: string[]; // other groups co-hosting, when two groups listed the same night
  host?: string; // set on events approved from the candidates issue, which have no group here
}

export const TZ = 'Europe/London';

// The content security policy every page carries. GitHub Pages can't send response headers, so
// it goes in a <meta> tag. Scripts may only come from this site, plus Cloudflare's analytics
// beacon: nothing inline.
// Styles still allow inline, for the style attributes on /pro; Google is there for /pro's typeface.
export const CSP = [
  "default-src 'self'",
  // Cloudflare, which sits in front of the site, adds its Web Analytics beacon to every page
  "script-src 'self' https://static.cloudflareinsights.com",
  "connect-src 'self' https://cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');
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
export const groupsOf = (e: Event): Group[] => [e.group, ...(e.with ?? [])].map(groupById);
export const hostName = (e: Event) => e.host ?? groupsOf(e).map(g => g.name).join(' + ');

export interface Headline { title: string; url: string; date: string; source: string; }
export const news: Headline[] = headlines.items;

export const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: TZ, ...opts }).format(new Date(iso));

// The calendar day in York, as YYYY-MM-DD.
export const dayKey = (iso: string) => fmt(iso, { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');

export const place = (e: Event) => [e.venue, e.address].filter(Boolean).join(', ');
export const mapLink = (e: Event) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(/\bYork\b/.test(place(e)) ? place(e) : place(e) + ', York')}`;

// A file-safe name for one event's own calendar file.
export const slug = (e: Event) => e.uid.replace(/@.*$/, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();

const stamp = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d+/, '');
const esc = (s = '') => s.replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');
// Lines over 75 bytes must be folded.
const fold = (line: string) => line.match(/.{1,70}/gu)!.join('\r\n ');

export function calendar(events: Event[], name = 'York tech events') {
  const now = stamp(new Date().toISOString());
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//yorkdevelopers.org//York tech events//EN',
    'CALSCALE:GREGORIAN', `X-WR-CALNAME:${esc(name)}`,
    ...events.flatMap(e => [
      'BEGIN:VEVENT', `UID:${e.uid}`, `DTSTAMP:${now}`, `DTSTART:${stamp(e.start)}`, `DTEND:${stamp(e.end)}`,
      `SUMMARY:${esc(`${e.title} (${hostName(e)})`)}`,
      `LOCATION:${esc(place(e))}`, `DESCRIPTION:${esc(e.summary)}`, `URL:${e.url ?? ''}`, 'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ];
  return new Response(lines.map(fold).join('\r\n') + '\r\n', { headers: { 'content-type': 'text/calendar; charset=utf-8' } });
}
