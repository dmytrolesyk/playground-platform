import { defineCollection } from 'astro:content';
import { knowledgeSchema } from '@playground/knowledge-engine/schema';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const cv = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cv' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
  }),
});

const knowledge = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/knowledge' }),
  schema: knowledgeSchema,
});

export const collections: Record<string, ReturnType<typeof defineCollection>> = { cv, knowledge };
