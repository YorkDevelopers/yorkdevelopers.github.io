import { upcoming, fetchedAt, groupById } from '../lib/york';

export const GET = () => Response.json({
  fetchedAt,
  events: upcoming().map(({ uid, group, title, start, end, url, venue, address, summary }) =>
    ({ uid, group, groupName: groupById(group).name, title, start, end, url, venue, address, summary })),
});
