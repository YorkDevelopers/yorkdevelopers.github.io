// Reads every group's event listing and writes src/data/events.json (upcoming) and
// src/data/past.json (finished events, kept as the site's history).
// Run by the GitHub Action before the site is built; `npm run fetch` does the same locally.
//
// A group in groups.yml can name any of three sources:
//   meetup      its address on meetup.com
//   eventbrite  its organiser page on Eventbrite
//   ical        the URL of any iCal feed (Luma, Google Calendar, ...)
//
// If one source can't be read, the events we already had from it are kept and the run
// carries on with a warning. If every source fails, the run fails so somebody notices.
import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'yaml';

const OUT = new URL('../src/data/events.json', import.meta.url);
const PAST = new URL('../src/data/past.json', import.meta.url);
const TZ = 'Europe/London';
const UA = { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36 yorkdevelopers.org' };
const KEEP_PAST = 300;

const groups = parse(await readFile(new URL('../groups.yml', import.meta.url), 'utf8'));
const manual = parse(await readFile(new URL('../events.yml', import.meta.url), 'utf8')) ?? [];
const previous = await readFile(OUT, 'utf8').then(JSON.parse, () => ({ events: [] }));
const past = await readFile(PAST, 'utf8').then(JSON.parse, () => ({ events: [] }));
const known = new Map(previous.events.map(e => [e.uid, e]));

const page = async url => {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
};

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
  if (!text.includes('BEGIN:VCALENDAR')) throw new Error('not a calendar feed');
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
  return events.filter(e => e.STATUS?.value !== 'CANCELLED' && e.DTSTART).map(e => ({
    uid: e.UID?.value,
    title: unescape(e.SUMMARY?.value ?? '').trim(),
    start: icsDate(e.DTSTART.value, e.DTSTART.params),
    end: e.DTEND ? icsDate(e.DTEND.value, e.DTEND.params) : null,
    url: e.URL?.value,
    venue: e.LOCATION ? unescape(e.LOCATION.value).split('\n')[0] : undefined,
    description: unescape(e.DESCRIPTION?.value ?? ''),
  }));
}

function summarise(text) {
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\\(.)/g, '$1').replace(/<[^>]+>/g, ' ')
    .replace(/[*_#]/g, '').replace(/\s+/g, ' ').trim();
  if (text.length <= 320) return text;
  const cut = text.slice(0, 320);
  return cut.slice(0, Math.max(cut.lastIndexOf('. ') + 1, cut.lastIndexOf(' '))).trim() + ' ...';
}

// Meetup's calendar feed has no location, but each event page carries it as structured data.
async function meetupVenue(url) {
  try {
    const loc = (await page(url)).match(/"location":\{"@type":"Place","name":"((?:[^"\\]|\\.)*)"(?:,"address":\{[^}]*?"streetAddress":"((?:[^"\\]|\\.)*)")?/);
    if (!loc) return {};
    return { venue: JSON.parse(`"${loc[1]}"`), address: loc[2] ? JSON.parse(`"${loc[2]}"`).replace(/, J7$/, '') : undefined };
  } catch { return {}; }
}

async function fromMeetup(slug) {
  const found = parseIcs(await page(`https://www.meetup.com/${slug}/events/ical/`));
  for (const e of found) {
    const old = known.get(e.uid);
    Object.assign(e, old?.venue ? { venue: old.venue, address: old.address } : await meetupVenue(e.url));
    // Meetup puts the group name on the first line of every description.
    e.description = e.description.split('\n').slice(1).join(' ');
  }
  return found;
}

// Eventbrite has no public feed: read the organiser page for event links, then each event's structured data.
async function fromEventbrite(organiser) {
  const links = new Set((await page(organiser)).match(/https:\/\/www\.eventbrite\.[a-z.]+\/e\/[a-z0-9-]+-tickets-\d+/g) ?? []);
  const found = [];
  for (const url of links) {
    const html = await page(url);
    for (const block of html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)) {
      let d; try { d = JSON.parse(block[1]); } catch { continue; }
      if (!String(d['@type']).includes('Event') || !d.startDate) continue;
      found.push({
        uid: `eventbrite-${url.match(/(\d+)$/)[1]}`, title: d.name, url,
        start: new Date(d.startDate).toISOString(), end: d.endDate ? new Date(d.endDate).toISOString() : null,
        venue: d.location?.name, address: d.location?.address?.streetAddress, description: d.description ?? '',
      });
      break;
    }
  }
  return found;
}

const fromIcal = async url => parseIcs(await page(url));

const sources = new Map(); // "kind:address" -> { read, groups }
for (const g of groups) {
  for (const [kind, read] of [['meetup', fromMeetup], ['eventbrite', fromEventbrite], ['ical', fromIcal]]) {
    if (!g[kind]) continue;
    const key = `${kind}:${g[kind]}`;
    if (!sources.has(key)) sources.set(key, { read: () => read(g[kind]), groups: [] });
    sources.get(key).groups.push(g);
  }
}

// Several groups can share one listing; `match` says which events are whose.
const groupFor = (candidates, title) =>
  (candidates.find(g => g.match && title.toLowerCase().includes(g.match)) ?? candidates.find(g => !g.match) ?? candidates[0]).id;

const now = Date.now();
const stamp = new Date(now).toISOString();
const events = [];
let failed = 0;
for (const [key, source] of sources) {
  try {
    const found = await source.read();
    for (const e of found) {
      events.push({
        uid: e.uid ?? `${key}-${e.start}`, feed: key, group: groupFor(source.groups, e.title), title: e.title,
        start: e.start, end: e.end ?? new Date(Date.parse(e.start) + 2 * 36e5).toISOString(),
        url: e.url, venue: e.venue, address: e.address, summary: summarise(e.description),
      });
    }
    console.log(`${key}: ${found.length} events`);
  } catch (err) {
    failed++;
    // events.json written before sources were named by kind used the bare Meetup address
    const kept = previous.events.filter(e => e.feed === key || `meetup:${e.feed}` === key);
    events.push(...kept);
    console.log(`::warning::${key} could not be read (${err.message}); kept ${kept.length} events from the last run`);
  }
}
if (sources.size && failed === sources.size) {
  console.error('::error::Every event source failed. Nothing was written.');
  process.exit(1);
}

const local = s => { const [y, mo, d, h, mi] = String(s).match(/\d+/g).map(Number); return fromZone(y, mo, d, h, mi); };
for (const e of manual) {
  events.push({
    uid: `manual-${e.group}-${e.start}`, feed: 'manual', group: e.group, title: e.title,
    start: local(e.start), end: local(e.end ?? e.start), url: e.url, venue: e.venue, summary: e.summary ?? '',
  });
}

// An event repeated three or more times is a regular series; the home page shows it as one line.
const repeats = Map.groupBy(events, e => `${e.group}|${e.title}`);
for (const e of events) {
  e.series = repeats.get(`${e.group}|${e.title}`).length >= 3 || undefined;
  e.seen = known.get(e.uid)?.seen ?? stamp; // when we first saw it, for the "new events" feed
}

const byStart = (a, b) => a.start.localeCompare(b.start);
const upcoming = events.filter(e => Date.parse(e.end) > now).sort(byStart);

// Anything we knew about that has now finished goes into the history.
const finished = [...previous.events, ...events].filter(e => Date.parse(e.end) <= now);
const history = [...new Map([...past.events, ...finished].map(e => [e.uid, e])).values()].sort(byStart).slice(-KEEP_PAST);

await writeFile(OUT, JSON.stringify({ fetchedAt: stamp, events: upcoming }, null, 2) + '\n');
await writeFile(PAST, JSON.stringify({ events: history }, null, 2) + '\n');
console.log(`wrote ${upcoming.length} upcoming events, ${history.length} past`);
