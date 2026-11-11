# yorkdevelopers.org

Developer meetups and tech events in York, UK, presented as a man page.

## How it works

- `groups.yml` lists the groups. Each one names where it posts events: a Meetup page, an Eventbrite organiser page, or any iCal feed.
- `scripts/fetch-events.mjs` reads those listings and writes `src/data/events.json` (upcoming) and `src/data/past.json` (history).
- [Astro](https://astro.build) builds the static site into `dist/`.
- `.github/workflows/deploy.yml` does both on every push and twice a day, deploys to GitHub Pages, and commits the refreshed event data back to the repo.

Finished events never show as upcoming: the build drops them, and the page hides any that end between builds.

## When something goes wrong

- **One source is unreachable:** the run carries on with a warning and keeps that group's last known events.
- **Every source is unreachable:** the run fails and GitHub emails whoever last edited the workflow. The last good site stays up.
- **The site hasn't refreshed for two days:** the home page shows a warning above the events.

## Common jobs

- **Add a group:** add an entry to `groups.yml`.
- **Add an event that isn't on a listed source:** add it to `events.yml`.
- **Retire a group:** set `retired: true` on its entry.
- **Help the filter find a group:** add words to its `tags`.
- **Change the link preview image:** edit `scripts/og.svg`, then run `node -e "require('sharp')('scripts/og.svg').png().toFile('public/og.png')"`.

## Run it locally

    npm install
    npm run fetch   # optional: refresh events
    npm run dev
