import { readdirSync } from 'node:fs';
import { defineConfig } from 'astro/config';

// The old Jekyll site published posts at /post/<Title>/ and /blog/<Title>/. Keep those links working.
const oldPosts = Object.fromEntries(readdirSync('./src/content/news').flatMap(file => {
  const id = file.replace(/\.md$/, '');
  const title = id.replace(/^\d{4}-\d\d-\d\d-/, '');
  return ['post', 'blog'].map(dir => [`/${dir}/${title}`, `/news/${id.toLowerCase()}/`]);
}));

// Each group used to have its own page.
const oldMeetups = ['ACCUYork', 'CodeAndCoffee', 'DataYork', 'FrontEventYork', 'MagentoYork', 'UmbracoYork',
  'YorkCodeDojo', 'YorkGameDevelopers', 'YorkSwift', 'agileYork', 'dotNetYork'];

export default defineConfig({
  site: 'https://www.yorkdevelopers.org',
  // Never inline a page's JavaScript into its HTML: every script is its own file, so the site
  // can be served under a content security policy that forbids inline scripts.
  vite: { build: { assetsInlineLimit: 0 } },
  redirects: {
    ...oldPosts,
    '/CodeOfConduct.html': '/code-of-conduct/',
    '/events': '/',
    // the home page's design was first tried out at /pro
    '/pro': '/',
    '/blog': '/news/',
    '/donate': '/about/',
    '/slack-signup': '/',
    '/yorktechfest': '/news/2018-12-01-yorktechfest-delivered/',
    '/yorktechfest2018': '/news/2018-11-27-yorktechfest-2018/',
    ...Object.fromEntries(oldMeetups.map(name => [`/meetup/${name}`, '/'])),
    ...Object.fromEntries([2, 3, 4, 5, 6].map(n => [`/page${n}`, '/news/'])),
  },
});
