// Collects York tech headlines from the feeds in news.yml into src/data/news.json.
// Run by the GitHub Action alongside fetch-events.mjs. There is no human review here, so the
// test is deliberately strict: it would rather miss a story than show an irrelevant one.
import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { page } from './lib.mjs';

const OUT = new URL('../src/data/news.json', import.meta.url);
const KEEP_DAYS = 45, KEEP_ITEMS = 40;

// What counts as a tech story. Matched against the headline only, as whole words.
const TECH = [
  'software', 'tech', 'technology', 'technologies', 'fintech', 'edtech', 'healthtech', 'deep tech', 'tech firm',
  'artificial intelligence', 'machine learning', 'robotics?', 'robots?', 'cyber', 'cyber ?security', 'cyber ?attack',
  'hackers?', 'hackathon', 'coding', 'coders?', 'programmers?', 'programming', 'software developers?',
  'web developers?', 'game developers?', 'games? studio', 'video ?games?', 'esports', 'startups?', 'start-ups?',
  'data cent(?:re|er)s?', 'data science', 'computing', 'computer science', 'quantum', 'semiconductors?', 'SaaS',
  'digital skills', 'digital hub', 'digital city', 'digital agency', 'open source', 'broadband', 'drones?', 'bioscience',
];
const tech = new RegExp(`\\b(?:${TECH.join('|')})\\b`, 'i');
const ai = /\bA\.?I\b/; // case-sensitive, so it doesn't match "ai" inside other words
const york = /(?<!New )\bYork\b(?!shire)/;

const { sources, block = [] } = parse(await readFile(new URL('../news.yml', import.meta.url), 'utf8'));
const blocked = new RegExp(block.map(b => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') || '(?!)', 'i');
const previous = await readFile(OUT, 'utf8').then(JSON.parse, () => ({ items: [] }));

const text = (s = '') => s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'")
  .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const tag = (xml, name) => xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`))?.[1];

function parseFeed(xml) {
  return [...xml.matchAll(/<(item|entry)[\s>][\s\S]*?<\/\1>/g)].map(([item]) => ({
    title: text(tag(item, 'title')),
    url: text(tag(item, 'link')) || item.match(/<link[^>]*href="([^"]+)"/)?.[1],
    date: new Date(text(tag(item, 'pubDate') ?? tag(item, 'published') ?? tag(item, 'updated') ?? '')),
    summary: text(tag(item, 'description') ?? tag(item, 'summary') ?? ''),
    via: text(tag(item, 'source') ?? ''), // Google News names the original publisher here
  }));
}

const fresh = [];
for (const source of sources) {
  try {
    const items = parseFeed(await page(source.url)).filter(i => i.title && i.url && !isNaN(i.date));
    const kept = items.filter(i =>
      (tech.test(i.title) || ai.test(i.title)) && !blocked.test(i.title) &&
      (source.local || york.test(i.title) || york.test(i.summary.slice(0, 300))));
    for (const i of kept) {
      // Google News appends " - Publisher" to every headline
      const title = i.via ? i.title.replace(new RegExp(`\\s+-\\s+${i.via.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), '') : i.title;
      fresh.push({ title, url: i.url, date: i.date.toISOString(), source: i.via || source.name });
    }
    console.log(`${source.name}: kept ${kept.length} of ${items.length}`);
  } catch (err) {
    console.log(`::warning::news source ${source.name} could not be read (${err.message})`);
  }
}

// The same story often appears in several feeds: keep the first copy of each headline.
const key = t => t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 60);
const cutoff = Date.now() - KEEP_DAYS * 864e5;
const seen = new Set();
const items = [...previous.items, ...fresh]
  .filter(i => Date.parse(i.date) > cutoff && !seen.has(key(i.title)) && seen.add(key(i.title)))
  .sort((a, b) => b.date.localeCompare(a.date)).slice(0, KEEP_ITEMS);

await writeFile(OUT, JSON.stringify({ items }, null, 2) + '\n');
console.log(`wrote ${items.length} headlines`);
