import { z } from 'zod';

export const knowledgeSchema = z.object({
  title: z.string(),
  category: z.enum(['architecture', 'concept', 'technology', 'feature', 'lab', 'cs-fundamentals']),
  summary: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  relatedConcepts: z.array(z.string()).default([]),
  relatedFiles: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  externalReferences: z
    .array(
      z.object({
        title: z.string(),
        url: z.string(),
        type: z.enum(['article', 'video', 'docs', 'talk', 'repo', 'book']),
      }),
    )
    .default([]),
  diagramRef: z.string().optional(),
  order: z.number().optional(),
  dateAdded: z.date().optional(),
  lastUpdated: z.date().optional(),
  // v2 fields
  prerequisites: z.array(z.string()).default([]),
  learningObjectives: z.array(z.string()).default([]),
  exercises: z
    .array(
      z.object({
        question: z.string(),
        hint: z.string().optional(),
        answer: z.string(),
        type: z.enum(['predict', 'explain', 'do', 'debug']).default('explain'),
      }),
    )
    .default([]),
  estimatedMinutes: z.number().optional(),
  module: z.string().optional(),
  moduleOrder: z.number().optional(),

  // SKOS-inspired vocabulary management
  prefLabel: z.string().optional(),
  altLabels: z.array(z.string()).default([]),
  broader: z.array(z.string()).default([]),
  narrower: z.array(z.string()).default([]),
  conceptScheme: z.string().default('playground-platform'),

  // Epistemic metadata
  confidence: z
    .enum(['established', 'probable', 'uncertain', 'speculative'])
    .default('established'),
  evidenceType: z.enum(['authoritative', 'derived', 'empirical', 'analogical']).optional(),
  isContested: z.boolean().default(false),
});

export type KnowledgeArticleSchema = z.infer<typeof knowledgeSchema>;
