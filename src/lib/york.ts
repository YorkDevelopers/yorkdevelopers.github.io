import groupsYml from '../../groups.yml?raw';
import { parse } from 'yaml';
import data from '../data/events.json';

export interface Group {
  id: string; name: string; about: string; url?: string; meetup?: string;
  match?: string; tags?: string; runs?: string; retired?: boolean;
}
export interface Event {
  uid: string; group: string; title: string; start: string; end: string;
  url?: string; venue?: string; address?: string; summary?: string;
}

export const TZ = 'Europe/London';
export const groups: Group[] = parse(groupsYml);
export const fetchedAt: string = data.fetchedAt;

// Events are current until they end. The page also re-checks this in the browser.
export const upcoming = (): Event[] =>
  (data.events as Event[]).filter(e => Date.parse(e.end) > Date.now());

export const groupById = (id: string) => groups.find(g => g.id === id) ?? { id, name: id, about: '' };

export const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: TZ, ...opts }).format(new Date(iso));

// The calendar day in York, as YYYY-MM-DD.
export const dayKey = (iso: string) => fmt(iso, { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
