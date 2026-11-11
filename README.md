# yorkdevelopers.org

Developer meetups and tech events in York, UK, presented as a man page.

## How it works

- `groups.yml` lists the groups. Each one names where it posts events: a Meetup page, an Eventbrite organiser page, or any iCal feed.
- `scripts/fetch-events.mjs` reads those listings and writes `src/data/events.json` (upcoming) and `src/data/past.json` (history).
- [Astro](https://astro.build) builds the static site into `dist/`.
- `.github/workflows/deploy.yml` does both on every push and twice a day, deploys to GitHub Pages, and commits the refreshed event data back to the repo.

Finished events never show as upcoming: the build drops them, and the page hides any that end between builds.

## Events from groups we don't list

`scripts/discover.mjs` searches Meetup's tech events near York and Luma events within a few miles of York for anything that isn't from a group in `groups.yml`. What it finds is **not published**. It goes on a GitHub issue labelled `event-candidates`, where each event has two tick boxes:

- **Add to site** publishes that one event.
- **Ignore** dismisses it.

Ticking a box runs `.github/workflows/review-candidates.yml`, which records the decision and rebuilds the site. Only people who can edit issues in this repo can tick the boxes. If an organiser keeps turning up, add them to `groups.yml` instead.

Eventbrite blocks automated access to its search pages, so Eventbrite organisers have to be added to `groups.yml` by hand.

## News headlines

`scripts/fetch-news.mjs` reads the feeds in `news.yml` and keeps headlines that read as tech stories about York. Nobody reviews these, so the test is strict. To tune it:

- **Drop a kind of story:** add a word or phrase to `block` in `news.yml`.
- **Add or remove a feed:** edit `sources` in `news.yml`.
- **Change what counts as tech:** edit the `TECH` list at the top of `scripts/fetch-news.mjs`.

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
