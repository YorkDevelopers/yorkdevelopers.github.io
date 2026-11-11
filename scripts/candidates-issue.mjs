// Keeps one GitHub issue, labelled "event-candidates", listing the events discover.mjs found
// that nobody has decided on yet. Ticking a box on that issue approves or ignores an event
// (review-candidates.mjs acts on the ticks).
//
// Without GITHUB_TOKEN (for example on your own machine) it only prints what it would post.
import { readFile, writeFile } from 'node:fs/promises';

const FILE = new URL('../src/data/candidates.json', import.meta.url);
const LABEL = 'event-candidates';
const { GITHUB_TOKEN: token, GITHUB_REPOSITORY: repo } = process.env;

const state = await readFile(FILE, 'utf8').then(JSON.parse, () => ({ candidates: [] }));
const pending = state.candidates.filter(c => c.status === 'pending' && Date.parse(c.end) > Date.now());
const fresh = pending.filter(c => !c.announced);

const when = iso => new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
}).format(new Date(iso));
// Titles come from other websites: keep them from being read as markdown or mentions.
const plain = (s = '') => s.replace(/[\r\n]+/g, ' ').replace(/([\\`*_[\]<>@#|])/g, '\\$1').slice(0, 300);

const body = `These events were found near York but are not from a group in \`groups.yml\`. Nothing here is on the site yet.

Tick **Add to site** to publish an event, or **Ignore** to dismiss it. The site rebuilds within a few minutes and this list is redrawn. Events left undecided drop off after they finish.

If an organiser keeps turning up, add them to \`groups.yml\` so their events are listed automatically.

${pending.map(c => `### ${plain(c.title)}
${when(c.start)}${c.venue ? `, ${plain(c.venue)}` : ''}. Hosted by ${plain(c.host)} on ${c.source}. [Event page](${c.url})${c.summary ? `\n\n> ${plain(c.summary)}` : ''}

- [ ] Add to site <!-- add:${c.id} -->
- [ ] Ignore <!-- ignore:${c.id} -->`).join('\n\n')}
`;

if (!token || !repo) {
  console.log(pending.length ? body : 'No candidates awaiting review.');
  process.exit(0);
}

const api = async (method, path, data) => {
  const res = await fetch(`https://api.github.com/repos/${repo}${path}`, {
    method, body: data && JSON.stringify(data),
    headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'content-type': 'application/json' },
  });
  if (!res.ok) throw new Error(`${method} ${path}: HTTP ${res.status}`);
  return res.json();
};

const [open] = await api('GET', `/issues?labels=${LABEL}&state=open&creator=${encodeURIComponent('github-actions[bot]')}`);
const title = `${pending.length} event${pending.length === 1 ? '' : 's'} to review`;
if (!pending.length) {
  if (open) await api('PATCH', `/issues/${open.number}`, { state: 'closed', body: 'Everything has been reviewed.' });
} else if (!open) {
  await api('POST', '/issues', { title, body, labels: [LABEL] });
} else {
  if (open.body !== body) await api('PATCH', `/issues/${open.number}`, { title, body });
  // Editing an issue notifies nobody, so say when something new has arrived.
  if (fresh.length) await api('POST', `/issues/${open.number}/comments`, { body: `New: ${fresh.map(c => plain(c.title)).join('; ')}` });
}
for (const c of fresh) c.announced = true;
await writeFile(FILE, JSON.stringify(state, null, 2) + '\n');
console.log(`${pending.length} awaiting review, ${fresh.length} new`);
