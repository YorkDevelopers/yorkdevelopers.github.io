import { upcoming, fetchedAt, hostName } from '../lib/york';

export const GET = () => Response.json({
  fetchedAt,
  events: upcoming().map(e => (({ uid, group, title, start, end, url, venue, address, summary }) =>
    ({ uid, group, groupName: hostName(e), title, start, end, url, venue, address, summary }))(e)),
});
