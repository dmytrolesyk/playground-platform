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
        type: z
          .enum(['predict', 'explain', 'do', 'debug', 'arrange', 'compare', 'trace', 'code'])
          .default('explain'),
        // 'arrange' (Parsons problems) — fragments in scrambled order, learner determines correct sequence
        fragments: z.array(z.string()).optional(),
        correctOrder: z.array(z.number()).optional(),
        // 'compare' — two approaches with tradeoff analysis
        approachA: z.string().optional(),
        approachB: z.string().optional(),
        // 'trace' — step-by-step execution tracing
        steps: z
          .array(
            z.object({
              description: z.string(),
              expectedState: z.string(),
            }),
          )
          .optional(),
        // 'code' — write or fix code in an in-page editor
        starterCode: z.string().optional(),
        solution: z.string().optional(),
        testCases: z
          .array(
            z.object({
              input: z.string(),
              expected: z.string(),
            }),
          )
          .optional(),
        language: z.enum(['typescript', 'javascript', 'python', 'html', 'css']).optional(),
        // Links exercise to concept article IDs (for future mastery assessment)
        targetConcepts: z.array(z.string()).optional(),
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
