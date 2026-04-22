export interface ArchNode {
  id: string;
  label: string;
  category: 'astro' | 'solidjs' | 'registry' | 'app' | 'css' | 'infrastructure' | 'concept';
  x: number;
  y: number;
  width: number;
  height: number;
  description: string;
  knowledgeSlug?: string;
  sourceFiles?: string[];
  children?: string[];
}

export interface ArchEdge {
  from: string;
  to: string;
  label?: string;
  type: 'data-flow' | 'dependency' | 'renders' | 'lazy-load';
}

export interface ArchLayer {
  id: string;
  label: string;
  edgeType: ArchEdge['type'];
  color: string;
  defaultVisible: boolean;
}

export const LAYERS: ArchLayer[] = [
  {
    id: 'data-flow',
    label: 'Data Flow',
    edgeType: 'data-flow',
    color: '#e74c3c',
    defaultVisible: true,
  },
  {
    id: 'dependency',
    label: 'Dependencies',
    edgeType: 'dependency',
    color: '#3498db',
    defaultVisible: true,
  },
  {
    id: 'renders',
    label: 'Renders',
    edgeType: 'renders',
    color: '#2ecc71',
    defaultVisible: false,
  },
  {
    id: 'lazy-load',
    label: 'Lazy Loading',
    edgeType: 'lazy-load',
    color: '#f39c12',
    defaultVisible: false,
  },
];

export const NODES: ArchNode[] = [
  // Astro layer (top)
  {
    id: 'content-collections',
    label: 'Content Collections',
    category: 'astro',
    x: 50,
    y: 30,
    width: 150,
    height: 50,
    description: 'Markdown CV files validated by Zod schema at build time.',
    knowledgeSlug: 'architecture/overview',
    sourceFiles: ['src/content.config.ts', 'src/content/cv/'],
  },
  {
    id: 'index-astro',
    label: 'index.astro',
    category: 'astro',
    x: 250,
    y: 30,
    width: 130,
    height: 50,
    description: 'The main page. Renders CV HTML at build time, hydrates Desktop island.',
    knowledgeSlug: 'architecture/overview',
    sourceFiles: ['src/pages/index.astro'],
  },
  {
    id: 'cv-json',
    label: '<script#cv-data>',
    category: 'astro',
    x: 430,
    y: 30,
    width: 150,
    height: 50,
    description: 'Pre-rendered CV HTML serialized as JSON. Zero runtime Markdown processing.',
    knowledgeSlug: 'architecture/overview',
  },
  {
    id: 'api-contact',
    label: '/api/contact',
    category: 'astro',
    x: 650,
    y: 30,
    width: 130,
    height: 50,
    description: 'SSR endpoint. Sends email via Resend. Uses process.env for secrets.',
    knowledgeSlug: 'architecture/overview',
    sourceFiles: ['src/pages/api/contact.ts'],
  },
  {
    id: 'learn-routes',
    label: '/learn/*',
    category: 'astro',
    x: 830,
    y: 30,
    width: 120,
    height: 50,
    description:
      'Static knowledge base pages. Curriculum index with modules, progress tracking, and per-article learning objectives, exercises, and module navigation.',
    knowledgeSlug: 'architecture/data-flow',
    sourceFiles: ['src/pages/learn/index.astro', 'src/pages/learn/[...slug].astro'],
  },
  {
    id: 'knowledge-collection',
    label: 'Knowledge Collection',
    category: 'astro',
    x: 830,
    y: 100,
    width: 160,
    height: 50,
    description:
      'Markdown articles in 6 categories: architecture, concepts, technologies, features, CS fundamentals, labs. Zod-validated frontmatter with exercises, prerequisites, and module assignments.',
    knowledgeSlug: 'architecture/data-flow',
    sourceFiles: ['src/content/knowledge/', 'src/content.config.ts'],
  },
  {
    id: 'knowledge-audit',
    label: 'Knowledge Audit',
    category: 'infrastructure',
    x: 430,
    y: 105,
    width: 150,
    height: 45,
    description:
      'Node TypeScript audit that validates knowledge links, prerequisite cycles, modules, and renderer-agnostic Architecture Explorer graph data.',
    knowledgeSlug: 'concepts/executable-quality-gates',
    sourceFiles: [
      'scripts/audit-knowledge.ts',
      'scripts/knowledge-audit/load.ts',
      'scripts/knowledge-audit/rules.ts',
    ],
  },
  {
    id: 'mastery-progress',
    label: 'Mastery Progress',
    category: 'concept',
    x: 430,
    y: 165,
    width: 150,
    height: 45,
    description:
      'Progressive localStorage model that separates reading, checking, practicing, and mastering knowledge articles.',
    knowledgeSlug: 'features/knowledge-reliability-mastery',
    sourceFiles: [
      'src/scripts/learn-progress.ts',
      'src/layouts/LearnLayout.astro',
      'src/pages/learn/index.astro',
      'src/pages/learn/[...slug].astro',
    ],
  },

  // SolidJS island layer (middle)
  {
    id: 'desktop',
    label: 'Desktop',
    category: 'solidjs',
    x: 100,
    y: 150,
    width: 120,
    height: 50,
    description: 'Root SolidJS component. Single island. Provides DesktopContext.',
    knowledgeSlug: 'architecture/overview',
    sourceFiles: ['src/components/desktop/Desktop.tsx'],
  },
  {
    id: 'desktop-icon-grid',
    label: 'DesktopIconGrid',
    category: 'solidjs',
    x: 50,
    y: 240,
    width: 150,
    height: 45,
    description: 'Renders desktop icons from APP_REGISTRY. Handles icon drag.',
    sourceFiles: ['src/components/desktop/DesktopIconGrid.tsx'],
  },
  {
    id: 'window-manager',
    label: 'WindowManager',
    category: 'solidjs',
    x: 250,
    y: 240,
    width: 150,
    height: 45,
    description: 'Renders all open windows. Resolves app components from registry.',
    knowledgeSlug: 'architecture/window-manager',
    sourceFiles: ['src/components/desktop/WindowManager.tsx'],
  },
  {
    id: 'window',
    label: 'Window',
    category: 'solidjs',
    x: 270,
    y: 310,
    width: 110,
    height: 45,
    description: 'Generic draggable window. Pointer events, z-index, resize handles.',
    knowledgeSlug: 'architecture/window-manager',
    sourceFiles: ['src/components/desktop/Window.tsx'],
  },
  {
    id: 'taskbar',
    label: 'Taskbar',
    category: 'solidjs',
    x: 450,
    y: 240,
    width: 110,
    height: 45,
    description: 'Fixed bottom bar. Start menu + task buttons for open windows.',
    sourceFiles: ['src/components/desktop/Taskbar.tsx'],
  },
  {
    id: 'desktop-store',
    label: 'DesktopStore',
    category: 'solidjs',
    x: 250,
    y: 150,
    width: 140,
    height: 50,
    description: 'Single createStore: windows, windowOrder, nextZIndex, isMobile.',
    knowledgeSlug: 'architecture/overview',
    sourceFiles: ['src/components/desktop/store/desktop-store.ts'],
  },

  // Registry
  {
    id: 'app-registry',
    label: 'APP_REGISTRY',
    category: 'registry',
    x: 620,
    y: 200,
    width: 140,
    height: 50,
    description: 'Central registry. registerApp() → app appears everywhere automatically.',
    knowledgeSlug: 'architecture/app-registry',
    sourceFiles: [
      'src/components/desktop/apps/registry.ts',
      'src/components/desktop/apps/app-manifest.ts',
    ],
  },

  // Apps layer (bottom)
  {
    id: 'browser-app',
    label: 'BrowserApp',
    category: 'app',
    x: 50,
    y: 430,
    width: 120,
    height: 45,
    description: 'CV viewer. Reads pre-rendered HTML from JSON script tag.',
    sourceFiles: ['src/components/desktop/apps/BrowserApp.tsx'],
  },
  {
    id: 'explorer-app',
    label: 'ExplorerApp',
    category: 'app',
    x: 190,
    y: 430,
    width: 120,
    height: 45,
    description: 'File browser. Download links to static PDF/DOCX.',
    sourceFiles: ['src/components/desktop/apps/ExplorerApp.tsx'],
  },
  {
    id: 'email-app',
    label: 'EmailApp',
    category: 'app',
    x: 330,
    y: 430,
    width: 110,
    height: 45,
    description: 'Contact form. Posts to /api/contact → Resend.',
    sourceFiles: ['src/components/desktop/apps/EmailApp.tsx'],
  },
  {
    id: 'terminal-app',
    label: 'TerminalApp',
    category: 'app',
    x: 460,
    y: 430,
    width: 120,
    height: 45,
    description: 'xterm.js terminal. Lazy-loaded (~300KB). Custom command handler.',
    sourceFiles: ['src/components/desktop/apps/TerminalApp.tsx'],
  },
  {
    id: 'snake-game',
    label: 'Snake',
    category: 'app',
    x: 600,
    y: 430,
    width: 100,
    height: 45,
    description: 'Canvas-based Snake game. Pure game engine + SolidJS wrapper.',
    sourceFiles: ['src/components/desktop/apps/games/Snake.tsx'],
  },
  {
    id: 'library-app',
    label: 'LibraryApp',
    category: 'app',
    x: 720,
    y: 430,
    width: 120,
    height: 45,
    description: 'Knowledge base reader. Iframe browser for /learn/* routes.',
    sourceFiles: ['src/components/desktop/apps/library/LibraryApp.tsx'],
  },
  {
    id: 'architecture-explorer-app',
    label: 'ArchExplorer',
    category: 'app',
    x: 860,
    y: 430,
    width: 120,
    height: 45,
    description: 'Interactive architecture diagram. SVG nodes, edges, layers.',
    sourceFiles: ['src/components/desktop/apps/architecture-explorer/ArchitectureExplorer.tsx'],
  },

  // Concept layer (foundational CS concepts)
  {
    id: 'observer-pattern',
    label: 'Observer Pattern',
    category: 'concept',
    x: 620,
    y: 310,
    width: 130,
    height: 45,
    description:
      'Pub/sub → Observer → Reactive signals progression. Foundation of SolidJS reactivity.',
    knowledgeSlug: 'concepts/observer-pattern',
  },
  {
    id: 'javascript-proxies',
    label: 'JS Proxies',
    category: 'concept',
    x: 770,
    y: 310,
    width: 120,
    height: 45,
    description: 'How Proxy/Reflect enable fine-grained tracking in SolidJS stores.',
    knowledgeSlug: 'concepts/javascript-proxies',
  },
  {
    id: 'event-loop',
    label: 'Event Loop',
    category: 'concept',
    x: 620,
    y: 370,
    width: 130,
    height: 45,
    description: 'Call stack, task queue, microtask queue. Why batch() works and effects schedule.',
    knowledgeSlug: 'concepts/event-loop-and-microtasks',
  },
  {
    id: 'rendering-pipeline',
    label: 'Rendering Pipeline',
    category: 'concept',
    x: 770,
    y: 370,
    width: 140,
    height: 45,
    description:
      'Parse → Style → Layout → Paint → Composite. Why some CSS is free and some causes reflow.',
    knowledgeSlug: 'concepts/browser-rendering-pipeline',
  },
  {
    id: 'module-systems',
    label: 'Module Systems',
    category: 'concept',
    x: 620,
    y: 140,
    width: 130,
    height: 45,
    description: 'CommonJS → ESM, static vs dynamic imports, tree shaking, chunk splitting.',
    knowledgeSlug: 'concepts/module-systems-and-bundling',
  },
  {
    id: 'progressive-enhancement',
    label: 'Progressive Enhancement',
    category: 'concept',
    x: 770,
    y: 140,
    width: 160,
    height: 45,
    description:
      'Core content without JS → enhanced experience with JS. Astro is PE by architecture.',
    knowledgeSlug: 'concepts/progressive-enhancement',
  },

  // CSS layer
  {
    id: 'css-98',
    label: '98.css',
    category: 'css',
    x: 50,
    y: 540,
    width: 100,
    height: 45,
    description: 'Win98 aesthetic. Buttons, windows, title bars, inputs — all from 98.css classes.',
    knowledgeSlug: 'architecture/overview',
  },
  {
    id: 'crt-frame',
    label: 'CRT Frame',
    category: 'css',
    x: 180,
    y: 540,
    width: 110,
    height: 45,
    description: 'Pure CSS CRT monitor. Glass effect, scanlines, vignette, chin with buttons.',
    sourceFiles: ['src/components/desktop/CrtMonitorFrame.tsx'],
  },
];

export const EDGES: ArchEdge[] = [
  // Data flow
  {
    from: 'content-collections',
    to: 'index-astro',
    label: 'renders',
    type: 'data-flow',
  },
  {
    from: 'index-astro',
    to: 'cv-json',
    label: 'serializes HTML',
    type: 'data-flow',
  },
  {
    from: 'cv-json',
    to: 'browser-app',
    label: 'reads JSON',
    type: 'data-flow',
  },
  {
    from: 'email-app',
    to: 'api-contact',
    label: 'POST',
    type: 'data-flow',
  },

  // Dependency / reads from
  {
    from: 'desktop',
    to: 'desktop-store',
    label: 'provides context',
    type: 'dependency',
  },
  {
    from: 'desktop-icon-grid',
    to: 'app-registry',
    label: 'reads icons',
    type: 'dependency',
  },
  {
    from: 'taskbar',
    to: 'app-registry',
    label: 'reads apps',
    type: 'dependency',
  },
  {
    from: 'window-manager',
    to: 'app-registry',
    label: 'resolves component',
    type: 'dependency',
  },
  {
    from: 'desktop-icon-grid',
    to: 'desktop-store',
    type: 'dependency',
  },
  {
    from: 'window-manager',
    to: 'desktop-store',
    type: 'dependency',
  },
  { from: 'taskbar', to: 'desktop-store', type: 'dependency' },

  // Renders
  {
    from: 'index-astro',
    to: 'desktop',
    label: 'client:load',
    type: 'renders',
  },
  {
    from: 'desktop',
    to: 'desktop-icon-grid',
    type: 'renders',
  },
  {
    from: 'desktop',
    to: 'window-manager',
    type: 'renders',
  },
  { from: 'desktop', to: 'taskbar', type: 'renders' },
  {
    from: 'window-manager',
    to: 'window',
    type: 'renders',
  },

  // Lazy load
  {
    from: 'app-registry',
    to: 'terminal-app',
    label: 'lazy()',
    type: 'lazy-load',
  },
  {
    from: 'app-registry',
    to: 'snake-game',
    label: 'lazy()',
    type: 'lazy-load',
  },
  {
    from: 'app-registry',
    to: 'library-app',
    label: 'lazy()',
    type: 'lazy-load',
  },
  {
    from: 'app-registry',
    to: 'architecture-explorer-app',
    label: 'lazy()',
    type: 'lazy-load',
  },
  {
    from: 'library-app',
    to: 'learn-routes',
    label: 'iframe',
    type: 'data-flow',
  },
  {
    from: 'architecture-explorer-app',
    to: 'library-app',
    label: 'opens article',
    type: 'data-flow',
  },

  // Knowledge system
  {
    from: 'knowledge-collection',
    to: 'learn-routes',
    label: 'builds into',
    type: 'data-flow',
  },
  {
    from: 'knowledge-collection',
    to: 'knowledge-audit',
    label: 'validated by',
    type: 'dependency',
  },
  {
    from: 'learn-routes',
    to: 'mastery-progress',
    label: 'enhanced by',
    type: 'dependency',
  },
  {
    from: 'content-collections',
    to: 'knowledge-collection',
    label: 'same pattern',
    type: 'dependency',
  },

  // Concept → implementation dependencies
  {
    from: 'observer-pattern',
    to: 'desktop-store',
    label: 'signals use',
    type: 'dependency',
  },
  {
    from: 'javascript-proxies',
    to: 'desktop-store',
    label: 'stores use',
    type: 'dependency',
  },
  {
    from: 'module-systems',
    to: 'app-registry',
    label: 'dynamic import()',
    type: 'dependency',
  },
  {
    from: 'rendering-pipeline',
    to: 'crt-frame',
    label: 'compositor layer',
    type: 'dependency',
  },
  {
    from: 'rendering-pipeline',
    to: 'window',
    label: 'GPU compositing',
    type: 'dependency',
  },
  {
    from: 'progressive-enhancement',
    to: 'index-astro',
    label: 'static-first',
    type: 'dependency',
  },
  {
    from: 'event-loop',
    to: 'desktop-store',
    label: 'batch scheduling',
    type: 'dependency',
  },
];

// Category colors for node backgrounds
export const CATEGORY_COLORS: Record<string, string> = {
  astro: '#f0e6ff',
  solidjs: '#e6f3ff',
  registry: '#fff3e6',
  app: '#e6ffe6',
  css: '#ffe6e6',
  infrastructure: '#f0f0f0',
  concept: '#fdf6e3',
};

export const CATEGORY_BORDER_COLORS: Record<string, string> = {
  astro: '#9b59b6',
  solidjs: '#3498db',
  registry: '#e67e22',
  app: '#27ae60',
  css: '#e74c3c',
  infrastructure: '#95a5a6',
  concept: '#b58900',
};
