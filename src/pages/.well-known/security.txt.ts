// Where to report a security problem with the site (RFC 9116). The file must carry an expiry
// date, so it is written at build time: the site rebuilds twice a day, which keeps it current.
import { SITE } from '../../lib/york';

export const GET = () => new Response([
  'Contact: mailto:code@yorkdevelopers.org',
  `Expires: ${new Date(Date.now() + 180 * 864e5).toISOString()}`,
  'Preferred-Languages: en',
  `Canonical: ${SITE}/.well-known/security.txt`,
  '',
].join('\n'), { headers: { 'content-type': 'text/plain; charset=utf-8' } });
