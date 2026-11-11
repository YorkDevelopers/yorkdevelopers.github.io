// Reads every group's public Meetup calendar feed and writes src/data/events.json.
// Run by the daily GitHub Action before the site is built; `npm run fetch` does the same locally.
// If a feed can't be reached, the events we already had for it are kept.
import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'yaml';

const OUT = new URL('../src/data/events.json', import.meta.url);
const TZ = 'Europe/London';
const UA = { 'user-agent': 'Mozilla/5.0 (yorkdevelopers.org event listing)' };

const groups = parse(await readFile(new URL('../groups.yml', import.meta.url), 'utf8'));
const manual = parse(await readFile(new URL('../events.yml', import.meta.url), 'utf8')) ?? [];
const previous = await readFile(OUT, 'utf8').then(JSON.parse, () => ({ events: [] }));
const known = new Map(previous.events.map(e => [e.uid, e]));

// Milliseconds the zone is ahead of UTC at the given instant.
function zoneOffset(ts, tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
  }).formatToParts(ts).filter(x => x.type !== 'literal').map(x => [x.type, +x.value]));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - ts;
}

// A wall-clock time in a zone, as a UTC ISO string.
function fromZone(y, mo, d, h = 0, mi = 0, tz = TZ) {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  return new Date(guess - zoneOffset(guess, tz)).toISOString();
}

function icsDate(value, params) {
  const m = value.match(/^(\d{4})(\d\d)(\d\d)(?:T(\d\d)(\d\d))?/);
  if (!m) return null;
  const [y, mo, d, h = 0, mi = 0] = m.slice(1).map(Number);
  if (value.endsWith('Z')) return new Date(Date.UTC(y, mo - 1, d, h, mi)).toISOString();
  return fromZone(y, mo, d, h, mi, params.match(/TZID=([^;]+)/)?.[1] ?? TZ);
}

const unescape = s => s.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1');

function parseIcs(text) {
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
  const events = [];
  let cur = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') cur = {};
    else if (line === 'END:VEVENT') { events.push(cur); cur = null; }
    else if (cur) {
      const m = line.match(/^([A-Z-]+)((?:;[^:]*)?):(.*)$/);
      if (m) cur[m[1]] = { value: m[3], params: m[2] };
    }
  }
  return events.filter(e => e.STATUS?.value !== 'CANCELLED').map(e => ({
    uid: e.UID?.value,
    title: unescape(e.SUMMARY?.value ?? '').trim(),
    start: icsDate(e.DTSTART.value, e.DTSTART.params),
    end: e.DTEND ? icsDate(e.DTEND.value, e.DTEND.params) : null,
    url: e.URL?.value,
    description: unescape(e.DESCRIPTION?.value ?? ''),
  }));
}

// Meetup puts the group name on the first line of every description; the rest is markdown-ish.
function summarise(description) {
  const text = description.split('\n').slice(1).join(' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\\(.)/g, '$1').replace(/[*_#]/g, '').replace(/\s+/g, ' ').trim();
  if (text.length <= 220) return text;
  const cut = text.slice(0, 220);
  return cut.slice(0, Math.max(cut.lastIndexOf('. ') + 1, cut.lastIndexOf(' '))).trim();
}

// The calendar feed has no location, but each event page carries it as structured data.
async function venueFor(url) {
  try {
    const html = await fetch(url, { headers: UA }).then(r => r.ok ? r.text() : '');
    const loc = html.match(/"location":\{"@type":"Place","name":"((?:[^"\\]|\\.)*)"(?:,"address":\{[^}]*?"streetAddress":"((?:[^"\\]|\\.)*)")?/);
    if (!loc) return {};
    const street = loc[2] ? JSON.parse(`"${loc[2]}"`).replace(/, J7$/, '') : undefined;
    return { venue: JSON.parse(`"${loc[1]}"`), address: street };
  } catch { return {}; }
}

const groupFor = (slug, title) => {
  const here = groups.filter(g => g.meetup === slug);
  return (here.find(g => g.match && title.toLowerCase().includes(g.match)) ?? here.find(g => !g.match) ?? here[0]).id;
};

const now = Date.now();
const events = [];
for (const slug of new Set(groups.map(g => g.meetup).filter(Boolean))) {
  try {
    const res = await fetch(`https://www.meetup.com/${slug}/events/ical/`, { headers: UA });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const found = parseIcs(await res.text());
    for (const e of found) {
      const old = known.get(e.uid);
      const place = old?.venue ? { venue: old.venue, address: old.address } : await venueFor(e.url);
      events.push({
        uid: e.uid, feed: slug, group: groupFor(slug, e.title), title: e.title,
        start: e.start, end: e.end ?? new Date(Date.parse(e.start) + 2 * 36e5).toISOString(),
        url: e.url, ...place, summary: summarise(e.description),
      });
    }
    console.log(`${slug}: ${found.length} events`);
  } catch (err) {
    const kept = previous.events.filter(e => e.feed === slug);
    events.push(...kept);
    console.warn(`${slug}: ${err.message}; kept ${kept.length} from last run`);
  }
}

const local = s => { const [y, mo, d, h, mi] = String(s).match(/\d+/g).map(Number); return fromZone(y, mo, d, h, mi); };
for (const [i, e] of manual.entries()) {
  events.push({
    uid: `manual-${i}-${e.start}`, feed: 'manual', group: e.group, title: e.title,
    start: local(e.start), end: local(e.end ?? e.start), url: e.url, venue: e.venue, summary: e.summary ?? '',
  });
}

const upcoming = events.filter(e => Date.parse(e.end) > now).sort((a, b) => a.start.localeCompare(b.start));
await writeFile(OUT, JSON.stringify({ fetchedAt: new Date(now).toISOString(), events: upcoming }, null, 2) + '\n');
console.log(`wrote ${upcoming.length} upcoming events`);
