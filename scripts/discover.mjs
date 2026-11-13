// Looks for tech events in York that are NOT from a group in groups.yml, and records them in
// src/data/candidates.json as "pending". Nothing found here is published until somebody
// approves it on the candidates issue (see candidates-issue.mjs and review-candidates.mjs).
//
// Searched: Meetup's tech events near York, Luma events within a few miles of York, and
// Eventbrite's York listings (its science and tech category, plus a few keyword searches).
import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { page, summarise, meetupVenue, webUrl, fromZone } from './lib.mjs';

const FILE = new URL('../src/data/candidates.json', import.meta.url);
const YORK = { lat: 53.959, lon: -1.082 };
const MAX_KM = 15;

const groups = parse(await readFile(new URL('../groups.yml', import.meta.url), 'utf8'));
const listed = await readFile(new URL('../src/data/events.json', import.meta.url), 'utf8').then(JSON.parse, () => ({ events: [] }));
const state = await readFile(FILE, 'utf8').then(JSON.parse, () => ({ candidates: [] }));
const known = new Map(state.candidates.map(c => [c.id, c]));
const knownMeetups = new Set(groups.map(g => g.meetup?.toLowerCase()).filter(Boolean));
const knownOrganisers = new Set(groups.map(g => g.eventbrite?.match(/(\d+)\/?$/)?.[1]).filter(Boolean));
const knownUrls = new Set(listed.events.map(e => e.url));
const now = Date.now();

const km = (lat, lon) => {
  const rad = d => d * Math.PI / 180;
  const a = Math.sin(rad(lat - YORK.lat) / 2) ** 2 + Math.cos(rad(YORK.lat)) * Math.cos(rad(lat)) * Math.sin(rad(lon - YORK.lon) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
};

async function meetup() {
  const html = await page('https://www.meetup.com/find/?location=gb--York&source=EVENTS&categoryId=546&distance=tenMiles');
  const data = JSON.parse(html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s)[1]).props.pageProps.__APOLLO_STATE__;
  const found = [];
  for (const [key, e] of Object.entries(data)) {
    if (!key.startsWith('Event:') || !e.title || e.eventType !== 'PHYSICAL') continue;
    const group = data[e.group?.__ref] ?? {};
    if (!group.urlname || knownMeetups.has(group.urlname.toLowerCase())) continue;
    const id = `meetup-${e.id}`;
    found.push({
      id, source: 'Meetup', title: e.title, start: new Date(e.dateTime).toISOString(),
      end: new Date(e.endTime ?? Date.parse(e.dateTime) + 2 * 36e5).toISOString(), url: e.eventUrl,
      host: group.name, hostUrl: `https://www.meetup.com/${group.urlname}/`, summary: summarise(e.description ?? ''),
      ...(known.has(id) ? {} : await meetupVenue(e.eventUrl)),
    });
  }
  return found;
}

async function luma() {
  const res = JSON.parse(await page(`https://api.lu.ma/discover/get-paginated-events?latitude=${YORK.lat}&longitude=${YORK.lon}&pagination_limit=50`));
  return res.entries.filter(({ event: e }) =>
    e.location_type === 'offline' && e.coordinate && km(e.coordinate.latitude, e.coordinate.longitude) <= MAX_KM,
  ).map(({ event: e, calendar, hosts }) => ({
    id: `luma-${e.api_id}`.toLowerCase().replace(/[^a-z0-9-]/g, ''), source: 'Luma', title: e.name,
    start: e.start_at, end: e.end_at ?? e.start_at, url: `https://lu.ma/${e.url}`,
    host: calendar?.name && calendar.name !== 'Personal' ? calendar.name : hosts?.[0]?.name ?? 'Luma',
    venue: e.geo_address_info?.address, address: e.geo_address_info?.full_address, summary: '',
  }));
}

// Eventbrite's keyword searches return anything with a matching word (board game nights for
// "game dev"), so an event is kept only if Eventbrite files it under science and tech, or its
// title or organiser's tags use one of these words.
const EVENTBRITE_SEARCHES = ['science-and-tech--events', 'game-dev', 'software', 'developers', 'programming', 'coding'];
const TECH = /\b(game ?dev\w*|game ?makers?\w*|developers?|software|programm\w+|coding|coders?|hack\w+|devops|python|javascript|machine learning|data science|cyber\w*|open source)\b/i;

async function eventbrite() {
  const found = new Map();
  let read = 0;
  for (const search of EVENTBRITE_SEARCHES) {
    let results;
    try {
      const html = await page(`https://www.eventbrite.co.uk/d/united-kingdom--york/${search}/`);
      results = JSON.parse(html.match(/window\.__SERVER_DATA__\s*=\s*(\{.*?\});\s*$/m)[1]).search_data.events.results;
      read++;
    } catch { continue; }
    for (const e of results) {
      const at = e.primary_venue?.address;
      if (e.is_online_event || e.is_cancelled || !at?.latitude || km(+at.latitude, +at.longitude) > MAX_KM) continue;
      if (knownOrganisers.has(e.primary_organizer_id)) continue;
      const tags = (e.tags ?? []).map(t => t.display_name);
      if (!(e.tags ?? []).some(t => t.tag === 'EventbriteCategory/102') && !TECH.test([e.name, ...tags].join(' '))) continue;
      const time = (date, clock) => fromZone(...date.split('-').map(Number), ...(clock ?? '00:00').split(':').map(Number), e.timezone);
      found.set(e.id, {
        id: `eventbrite-${e.id}`, source: 'Eventbrite', title: e.name, start: time(e.start_date, e.start_time),
        end: time(e.end_date ?? e.start_date, e.end_time ?? e.start_time), url: e.url,
        venue: e.primary_venue.name, address: at.localized_address_display, summary: summarise(e.summary ?? ''),
      });
    }
  }
  if (!read) throw new Error('no search page could be read');
  // The search results don't name the organiser: read it from the event page, once per event.
  for (const c of found.values()) {
    c.host = known.get(c.id)?.host ?? await page(c.url).then(
      html => html.match(/"organizer":\{"@type":"Organization","name":"((?:[^"\\]|\\.)*)"/)?.[1], () => undefined);
    c.host = c.host ? JSON.parse(`"${c.host}"`) : 'an Eventbrite organiser';
  }
  return [...found.values()];
}

for (const [name, search] of [['Meetup', meetup], ['Luma', luma], ['Eventbrite', eventbrite]]) {
  try {
    const found = (await search()).filter(c => webUrl(c.url) && Date.parse(c.end) > now && !knownUrls.has(c.url));
    for (const c of found) known.set(c.id, { status: 'pending', found: new Date(now).toISOString(), ...known.get(c.id), ...c });
    console.log(`${name}: ${found.length} events not from a listed group`);
  } catch (err) {
    console.log(`::warning::${name} search failed (${err.message})`);
  }
}

// Forget anything that finished more than a week ago, whatever was decided about it.
const candidates = [...known.values()].filter(c => Date.parse(c.end) > now - 7 * 864e5).sort((a, b) => a.start.localeCompare(b.start));
await writeFile(FILE, JSON.stringify({ candidates }, null, 2) + '\n');
console.log(`${candidates.filter(c => c.status === 'pending' && Date.parse(c.end) > now).length} candidates awaiting review`);
