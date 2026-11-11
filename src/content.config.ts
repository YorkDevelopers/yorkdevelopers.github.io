import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// News and blog posts carried over from the old site (2017 to 2019).
const news = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/news' }),
  schema: z.object({ title: z.string(), date: z.coerce.date() }),
});

export const collections = { news };
