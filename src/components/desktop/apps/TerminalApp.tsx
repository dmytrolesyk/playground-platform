import { createSignal, type JSX, onCleanup, onMount } from 'solid-js';
import { useDesktop } from '../store/context';
import './styles/terminal-app.css';

interface CvSection {
  slug: string;
  title: string;
  html: string;
}

function loadCvData(): CvSection[] {
  const el = document.getElementById('cv-data');
  if (!el?.textContent) return [];
  try {
    return JSON.parse(el.textContent) as CvSection[];
  } catch {
    return [];
  }
}

function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent ?? '';
}

function isArrowKey(data: string): boolean {
  return data === '\x1b[A' || data === '\x1b[B' || data === '\x1b[C' || data === '\x1b[D';
}

type CommandHandler = (args: string) => void;

function createCommandHandlers(
  terminal: { clear: () => void },
  writeLine: (text: string) => void,
  writePrompt: () => void,
  actions: { openWindow: (appId: string) => void },
): Record<string, CommandHandler> {
  return {
    help: () => writeLine(HELP_TEXT),
    about: () => writeLine(ASCII_BANNER),
    clear: () => {
      terminal.clear();
      writePrompt();
    },
    cv: (args: string) => handleCvCommand(args, writeLine),
    open: (args: string) => handleOpenCommand(args, writeLine, actions),
  };
}

function handleCvCommand(args: string, writeLine: (text: string) => void): void {
  const sections = loadCvData();
  if (args === '') {
    if (sections.length === 0) {
      writeLine('No CV data available.');
      return;
    }
    for (const section of sections) {
      writeLine(`=== ${section.title} ===`);
      writeLine(stripHtml(section.html));
      writeLine('');
    }
    return;
  }
  const match = sections.find(
    (s) => s.slug.toLowerCase() === args || s.title.toLowerCase() === args,
  );
  if (match) {
    writeLine(`=== ${match.title} ===`);
    writeLine(stripHtml(match.html));
  } else {
    writeLine(`Section not found: "${args}"`);
    writeLine(`Available sections: ${sections.map((s) => s.slug).join(', ')}`);
  }
}

function handleOpenCommand(
  target: string,
  writeLine: (text: string) => void,
  actions: { openWindow: (appId: string) => void },
): void {
  const appMap: Record<string, { id: string; label: string }> = {
    browser: { id: 'browser', label: 'CV Browser' },
    email: { id: 'email', label: 'Contact app' },
    explorer: { id: 'explorer', label: 'File Explorer' },
  };
  const app = appMap[target];
  if (app) {
    actions.openWindow(app.id);
    writeLine(`Opening ${app.label}...`);
  } else {
    writeLine(`Unknown app: "${target}"`);
    writeLine('Available: browser, email, explorer');
  }
}

const ASCII_BANNER = [
  '',
  '  Dmytro Lesyk - Software Engineer',
  "  Type 'help' for available commands.",
  '',
].join('\n');

const HELP_TEXT = [
  'Available commands:',
  '  help            Show this help message',
  '  about           Display info banner',
  '  cv              Print all CV sections',
  '  cv <section>    Print a specific CV section',
  '  open browser    Open the CV Browser',
  '  open email      Open the Contact app',
  '  open explorer   Open the File Explorer',
  '  clear           Clear the terminal',
  '',
].join('\n');

export function TerminalApp(): JSX.Element {
  const [, actions] = useDesktop();
  const [isLoaded, setIsLoaded] = createSignal(false);
  let containerRef: HTMLDivElement | undefined;
  let terminalInstance: import('@xterm/xterm').Terminal | undefined;
  let fitAddonInstance: import('@xterm/addon-fit').FitAddon | undefined;
  let currentLine = '';
  let resizeObserver: ResizeObserver | undefined;

  function getPrompt(): string {
    return 'C:\\Users\\guest> ';
  }

  function writePrompt(): void {
    terminalInstance?.write(getPrompt());
  }

  function writeLine(text: string): void {
    // Handle multi-line text by splitting on \n and writing each with \r\n
    const lines = text.split('\n');
    for (const line of lines) {
      terminalInstance?.write(`${line}\r\n`);
    }
  }

  function handleCommand(input: string): void {
    const cmd = input.trim().toLowerCase();

    if (cmd === '') {
      writePrompt();
      return;
    }

    const handlers = createCommandHandlers(
      { clear: () => terminalInstance?.clear() },
      writeLine,
      writePrompt,
      actions,
    );

    const [command, ...rest] = cmd.split(' ');
    const args = rest.join(' ');
    const handler = command ? handlers[command] : undefined;

    if (handler) {
      handler(args);
      // 'clear' writes its own prompt
      if (command !== 'clear') {
        writePrompt();
      }
    } else {
      writeLine(`Command not found: ${input.trim()}`);
      writeLine("Type 'help' for available commands.");
      writePrompt();
    }
  }

  onMount(async () => {
    const [{ Terminal }, { FitAddon }] = await Promise.all([
      import('@xterm/xterm'),
      import('@xterm/addon-fit'),
    ]);

    // Import xterm CSS
    await import('@xterm/xterm/css/xterm.css');

    if (!containerRef) return;

    const fitAddon = new FitAddon();
    fitAddonInstance = fitAddon;

    const terminal = new Terminal({
      theme: {
        background: '#000000',
        foreground: '#c0c0c0',
        cursor: '#c0c0c0',
        cursorAccent: '#000000',
        selectionBackground: '#000080',
      },
      fontFamily: '"Courier New", monospace',
      fontSize: 14,
      cursorBlink: true,
      cursorStyle: 'block',
      allowProposedApi: true,
    });

    terminalInstance = terminal;
    terminal.loadAddon(fitAddon);
    terminal.open(containerRef);

    // Fit to container
    requestAnimationFrame(() => {
      fitAddon.fit();
    });

    // Observe resize
    resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        fitAddon.fit();
      });
    });
    resizeObserver.observe(containerRef);

    // Write banner and prompt
    writeLine(ASCII_BANNER);
    writePrompt();

    // Handle input
    terminal.onData((data) => {
      handleTerminalInput(data, terminal);
    });

    setIsLoaded(true);
  });

  function handleTerminalInput(data: string, terminal: import('@xterm/xterm').Terminal): void {
    const code = data.charCodeAt(0);

    if (data === '\r') {
      terminal.write('\r\n');
      handleCommand(currentLine);
      currentLine = '';
      return;
    }

    if (code === 127 || data === '\b') {
      handleBackspace(terminal);
      return;
    }

    if (code === 3) {
      terminal.write('^C\r\n');
      currentLine = '';
      writePrompt();
      return;
    }

    if (isArrowKey(data)) {
      return;
    }

    if (code >= 32) {
      currentLine += data;
      terminal.write(data);
    }
  }

  function handleBackspace(terminal: import('@xterm/xterm').Terminal): void {
    if (currentLine.length > 0) {
      currentLine = currentLine.slice(0, -1);
      terminal.write('\b \b');
    }
  }

  onCleanup(() => {
    resizeObserver?.disconnect();
    fitAddonInstance?.dispose();
    terminalInstance?.dispose();
  });

  return (
    <div class="terminal-app">
      {!isLoaded() && (
        <div class="terminal-app__loading">
          <span>Loading terminal...</span>
        </div>
      )}
      <div
        ref={containerRef}
        class="terminal-app__container"
        style={{ display: isLoaded() ? 'block' : 'none' }}
      />
    </div>
  );
}
