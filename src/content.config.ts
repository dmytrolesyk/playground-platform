import { defineCollection, z } from 'astro:content';

const cv = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    order: z.number(),
  }),
});

export const collections: Record<string, ReturnType<typeof defineCollection>> = { cv };
