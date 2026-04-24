import mermaid from 'mermaid';

const DATA_LEARN_MERMAID_NORMALIZED = 'learnMermaidNormalized';

let isInitialized = false;

function ensureInitialized(): void {
  if (isInitialized) return;

  mermaid.initialize({
    startOnLoad: false,
    theme: 'neutral',
    securityLevel: 'loose',
  });

  isInitialized = true;
}

function collectArticleDiagramBlocks(): HTMLPreElement[] {
  const blocks = new Set<HTMLPreElement>();

  document.querySelectorAll('pre[data-language="mermaid"]').forEach((element) => {
    if (element instanceof HTMLPreElement) {
      blocks.add(element);
    }
  });

  document.querySelectorAll('pre > code.language-mermaid').forEach((element) => {
    const pre = element.parentElement;
    if (pre instanceof HTMLPreElement) {
      blocks.add(pre);
    }
  });

  return [...blocks];
}

function normalizeBlock(pre: HTMLPreElement): void {
  if (pre.dataset[DATA_LEARN_MERMAID_NORMALIZED] === 'true') {
    return;
  }

  const code = pre.querySelector('code');
  const source = code?.textContent ?? pre.textContent;
  if (!source) return;

  pre.classList.add('mermaid');
  pre.textContent = source;
  pre.dataset[DATA_LEARN_MERMAID_NORMALIZED] = 'true';
}

export async function initMermaid(): Promise<void> {
  ensureInitialized();

  for (const block of collectArticleDiagramBlocks()) {
    normalizeBlock(block);
  }

  await mermaid.run({ querySelector: '.mermaid' });
}
