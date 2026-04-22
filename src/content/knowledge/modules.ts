// src/content/knowledge/modules.ts

export interface CurriculumModule {
  id: string;
  title: string;
  objective: string;
  estimatedHours: number;
  checkpoint: string;
  prerequisites: string[]; // module IDs that should be completed first
  order: number;
}

export const MODULES: CurriculumModule[] = [
  {
    id: 'foundation',
    title: 'The Foundation',
    objective: 'Explain the 3-layer architecture and trace data from Markdown to screen',
    estimatedHours: 2,
    checkpoint:
      'Can you draw the build pipeline from memory? Describe each layer and how data flows between them.',
    prerequisites: [],
    order: 1,
  },
  {
    id: 'reactivity',
    title: 'Why SolidJS?',
    objective: 'Explain fine-grained reactivity and predict what re-renders when state changes',
    estimatedHours: 3,
    checkpoint:
      'Predict what happens when you call setState in a SolidJS store — then verify with the browser DevTools.',
    prerequisites: ['foundation'],
    order: 2,
  },
  {
    id: 'window-manager',
    title: 'The Window Manager',
    objective: 'Understand drag mechanics, compositor optimization, and pointer capture',
    estimatedHours: 2.5,
    checkpoint:
      'Explain why transform beats left/top for window dragging, with profiling evidence from DevTools.',
    prerequisites: ['foundation', 'reactivity'],
    order: 3,
  },
  {
    id: 'extensibility',
    title: 'Extensibility',
    objective: 'Build a new app using the registry pattern, end to end',
    estimatedHours: 1.5,
    checkpoint: 'You have built and registered a working Calculator app with tests.',
    prerequisites: ['foundation'],
    order: 4,
  },
  {
    id: 'full-stack',
    title: 'The Full Stack',
    objective: 'Trace a request from browser form submission to email inbox',
    estimatedHours: 2,
    checkpoint:
      'Explain every hop of a contact form submission: DOM event → fetch → Astro endpoint → Resend API → email delivery.',
    prerequisites: ['foundation'],
    order: 5,
  },
  {
    id: 'aesthetics-performance',
    title: 'Aesthetics & Performance',
    objective: 'Understand the CSS strategy, CRT frame, and event loop mechanics',
    estimatedHours: 1.5,
    checkpoint: 'Find and fix a deliberate memory leak using Chrome DevTools Memory panel.',
    prerequisites: ['foundation', 'reactivity'],
    order: 6,
  },
  {
    id: 'learning-system-reliability',
    title: 'Learning System Reliability',
    objective:
      'Turn knowledge content into an auditable graph, then use staged mastery to practice and verify understanding',
    estimatedHours: 2,
    checkpoint:
      'Break a knowledge link, diagnose the audit failure, repair the graph, and explain how progress stages preserve honest self-assessment.',
    prerequisites: ['foundation', 'extensibility'],
    order: 7,
  },
];
