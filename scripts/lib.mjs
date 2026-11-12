// Helpers shared by the scripts that read other sites.
export const TZ = 'Europe/London';
export const UA = { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36 yorkdevelopers.org' };

// Links read from other sites are only kept if they are ordinary web addresses.
export const webUrl = url => /^https?:\/\//i.test(url ?? '') ? url : undefined;

export const page = async url => {
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
export function fromZone(y, mo, d, h = 0, mi = 0, tz = TZ) {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  return new Date(guess - zoneOffset(guess, tz)).toISOString();
}

export function summarise(text) {
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\\(.)/g, '$1').replace(/<[^>]+>/g, ' ')
    .replace(/[*_#]/g, '').replace(/\s+/g, ' ').trim();
  if (text.length <= 320) return text;
  const cut = text.slice(0, 320);
  return cut.slice(0, Math.max(cut.lastIndexOf('. ') + 1, cut.lastIndexOf(' '))).trim() + ' ...';
}

// Meetup's calendar feed has no location, but each event page carries it as structured data.
export async function meetupVenue(url) {
  try {
    const loc = (await page(url)).match(/"location":\{"@type":"Place","name":"((?:[^"\\]|\\.)*)"(?:,"address":\{[^}]*?"streetAddress":"((?:[^"\\]|\\.)*)")?/);
    if (!loc) return {};
    return { venue: JSON.parse(`"${loc[1]}"`), address: loc[2] ? JSON.parse(`"${loc[2]}"`).replace(/, J7$/, '') : undefined };
  } catch { return {}; }
}

