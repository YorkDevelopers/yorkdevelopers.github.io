# yorkdevelopers.org

Developer meetups and tech events in York, UK, presented as a man page.

## How it works

- `groups.yml` lists the groups. Each one names its Meetup page.
- `scripts/fetch-events.mjs` reads every group's public Meetup calendar feed and writes `src/data/events.json`.
- [Astro](https://astro.build) builds the static site into `dist/`.
- `.github/workflows/deploy.yml` does both on every push and twice a day, then deploys to GitHub Pages.

Finished events never show: the build drops them, and the page hides any that end between builds.

## Common jobs

- **Add a group:** add an entry to `groups.yml`.
- **Add an event that isn't on Meetup:** add it to `events.yml`.
- **Retire a group:** set `retired: true` on its entry.

## Run it locally

    npm install
    npm run fetch   # optional: refresh events
    npm run dev
