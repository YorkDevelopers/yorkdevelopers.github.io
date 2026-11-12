// The pages search engines should know about. The man page is left out: it repeats the home page.
import { getCollection } from 'astro:content';
import { SITE } from '../lib/york';

export async function GET() {
  const posts = await getCollection('news');
  const paths = ['/', '/about/', '/code-of-conduct/', '/news/', ...posts.map(p => `/news/${p.id}/`)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map(p => `  <url><loc>${SITE}${p}</loc></url>`).join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
}
