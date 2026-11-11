// RSS feed of newly announced events: one item per event, dated when we first saw it.
import { upcoming, groupById, fmt, place, SITE } from '../lib/york';

const esc = (s = '') => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET = () => {
  // Weekly regulars would flood the feed, so each series appears once.
  const seen = new Set<string>();
  const items = upcoming()
    .filter(e => !e.series || !seen.has(e.group + e.title) && seen.add(e.group + e.title))
    .sort((a, b) => (b.seen ?? '').localeCompare(a.seen ?? ''))
    .map(e => {
      const when = fmt(e.start, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      return `<item>
  <title>${esc(`${e.title} (${groupById(e.group).name}, ${when})`)}</title>
  <link>${esc(e.url ?? SITE)}</link>
  <guid isPermaLink="false">${esc(e.uid)}</guid>
  <pubDate>${new Date(e.seen ?? e.start).toUTCString()}</pubDate>
  <description>${esc([when, place(e), e.summary].filter(Boolean).join('. '))}</description>
</item>`;
    });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>York tech events</title>
<link>${SITE}/</link>
<description>Newly announced developer meetups and tech events in York, UK.</description>
<language>en-gb</language>
${items.join('\n')}
</channel></rss>
`;
  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
};
