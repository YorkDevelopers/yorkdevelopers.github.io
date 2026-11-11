import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.yorkdevelopers.org',
  redirects: {
    '/CodeOfConduct.html': '/code-of-conduct/',
    '/events': '/',
  },
});
