// Run when somebody edits the candidates issue. Reads which boxes are ticked and records the
// decision in src/data/candidates.json. Only the ids this site wrote into the issue are read;
// nothing else in the issue text is used.
import { readFile, writeFile } from 'node:fs/promises';

const FILE = new URL('../src/data/candidates.json', import.meta.url);
const { issue } = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
const state = JSON.parse(await readFile(FILE, 'utf8'));
const byId = new Map(state.candidates.map(c => [c.id, c]));

let changed = 0;
for (const [, action, id] of (issue.body ?? '').matchAll(/^- \[[xX]\] .*<!-- (add|ignore):([a-z0-9-]+) -->\s*$/gm)) {
  const c = byId.get(id);
  if (!c || c.status !== 'pending') continue;
  c.status = action === 'add' ? 'approved' : 'ignored';
  changed++;
  console.log(`${c.status}: ${c.title}`);
}
await writeFile(FILE, JSON.stringify(state, null, 2) + '\n');
console.log(`${changed} decisions recorded`);
