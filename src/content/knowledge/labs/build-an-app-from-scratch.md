---
title: "Lab: Build an App from Scratch"
category: lab
summary: "Build a working Calculator app using the registry pattern — from pure logic to desktop icon — without editing any framework files."
difficulty: intermediate
relatedConcepts:
  - concepts/inversion-of-control
  - concepts/fine-grained-reactivity
  - concepts/observer-pattern
relatedFiles:
  - src/components/desktop/apps/registry.ts
  - src/components/desktop/apps/app-manifest.ts
  - src/components/desktop/store/types.ts
  - src/components/desktop/Desktop.tsx
  - src/components/desktop/WindowManager.tsx
technologies:
  - solidjs
  - typescript
order: 3
dateAdded: 2026-04-20
lastUpdated: 2026-04-23
externalReferences:
  - title: "SolidJS — Getting Started"
    url: "https://docs.solidjs.com/guides/foundations/why-solid"
    type: docs
  - title: "The Open-Closed Principle — Robert C. Martin"
    url: "https://blog.cleancoder.com/uncle-bob/2014/05/12/TheOpenClosedPrinciple.html"
    type: article
  - title: "98.css — A Design System for Building Faithful Recreations of Old UIs"
    url: "https://jdan.github.io/98.css/"
    type: docs
  - title: " — SolidJS"
    url: "https://www.solidjs.com/"
    type: article
  - title: "Registry — Refactoring Guru"
    url: "https://refactoring.guru/design-patterns/registry"
    type: article
prerequisites:
  - architecture/app-registry
  - concepts/inversion-of-control
learningObjectives:
  - "Add a fully functional app to the Windows 98 desktop without modifying any existing component files"
  - "Use the registerApp() pattern to wire an app into the desktop, start menu, taskbar, and terminal"
  - "Build a SolidJS component with signals for interactive state management"
  - "Verify the app works in all four access points: desktop icon, start menu, terminal open command, window manager"
exercises: []
estimatedMinutes: 60
module: extensibility
moduleOrder: 99
---

## Why This Lab Exists

The AGENTS.md says: "If you find yourself editing Desktop, WindowManager, Taskbar, or StartMenu to add a new app, you are doing it wrong." That's a bold claim. This lab proves it by having you build a complete Calculator app using [SolidJS](https://www.solidjs.com/) and the [98.css](https://jdan.github.io/98.css/) design system. You'll touch exactly two files: the new component and the manifest. Everything else — the desktop icon, start menu entry, window management, taskbar button, terminal `open` command — comes for free from the [registry pattern](https://refactoring.guru/design-patterns/registry).

## Setup

```bash
git checkout -b lab/build-calculator
pnpm dev
```

You'll create two new files and modify one existing file. No other files need changes.

## Experiment 1: Build the Calculator Engine

Start with pure logic — no UI, no framework. This makes the calculator testable and separates concerns.

**DO:** Create `src/components/desktop/apps/CalculatorApp.tsx`:

```tsx
import { createSignal, type JSX } from 'solid-js';

function calculate(a: number, op: string, b: number): number {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return b !== 0 ? a / b : 0;
    default: return b;
  }
}

export function CalculatorApp(): JSX.Element {
  const [display, setDisplay] = createSignal('0');
  const [firstOperand, setFirstOperand] = createSignal<number | null>(null);
  const [operator, setOperator] = createSignal<string | null>(null);
  const [waitingForSecond, setWaitingForSecond] = createSignal(false);

  const inputDigit = (digit: string): void => {
    if (waitingForSecond()) {
      setDisplay(digit);
      setWaitingForSecond(false);
    } else {
      setDisplay(display() === '0' ? digit : display() + digit);
    }
  };

  const inputOperator = (op: string): void => {
    const current = parseFloat(display());
    if (firstOperand() !== null && operator() && !waitingForSecond()) {
      const result = calculate(firstOperand()!, operator()!, current);
      setDisplay(String(result));
      setFirstOperand(result);
    } else {
      setFirstOperand(current);
    }
    setOperator(op);
    setWaitingForSecond(true);
  };

  const performEquals = (): void => {
    if (firstOperand() === null || !operator()) return;
    const result = calculate(firstOperand()!, operator()!, parseFloat(display()));
    setDisplay(String(result));
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecond(false);
  };

  const clear = (): void => {
    setDisplay('0');
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecond(false);
  };

  const buttons = [
    ['7', '8', '9', '/'],
    ['4', '5', '6', '*'],
    ['1', '2', '3', '-'],
    ['0', '.', '=', '+'],
  ];

  return (
    <div style={{
      padding: '8px',
      display: 'flex',
      'flex-direction': 'column',
      gap: '4px',
      height: '100%',
      'box-sizing': 'border-box',
    }}>
      <input
        type="text"
        readOnly
        value={display()}
        style={{
          'text-align': 'right',
          'font-size': '18px',
          padding: '4px 8px',
          'margin-bottom': '4px',
        }}
      />
      <div style={{
        display: 'flex',
        'justify-content': 'space-between',
        'margin-bottom': '4px',
      }}>
        <button type="button" onClick={clear} style={{ flex: '1' }}>
          C
        </button>
      </div>
      {buttons.map((row) => (
        <div style={{
          display: 'flex',
          gap: '4px',
        }}>
          {row.map((btn) => (
            <button
              type="button"
              style={{ flex: '1', padding: '8px', 'font-size': '14px' }}
              onClick={() => {
                if (btn === '=') performEquals();
                else if (['+', '-', '*', '/'].includes(btn)) inputOperator(btn);
                else inputDigit(btn);
              }}
            >
              {btn}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
```

**OBSERVE:** This is a self-contained SolidJS component. It uses `createSignal` for four pieces of state: the display string, the first operand, the pending operator, and a flag for whether we're waiting for a second operand. All UI is standard HTML styled with inline styles — 98.css handles the button and input aesthetics automatically.

**EXPLAIN:** The component follows the same pattern as every other app in this codebase (see `EmailApp.tsx`, `ContactApp.tsx`): a function that returns JSX, using SolidJS primitives for state. No class components, no lifecycle beyond what SolidJS provides. The `calculate` function is pure — it takes numbers and returns a number — making it trivially testable.

## Experiment 2: Register the App

**DO:** Open `src/components/desktop/apps/app-manifest.ts`. Add the import and registration at the bottom:

```tsx
import { CalculatorApp } from './CalculatorApp';

registerApp({
  id: 'calculator',
  title: 'Calculator',
  icon: '/icons/calculator_icon.png',
  component: CalculatorApp,
  desktop: true,
  startMenu: true,
  startMenuCategory: 'Programs',
  singleton: true,
  defaultSize: { width: 250, height: 320 },
});
```

You'll also need an icon. For this lab, reuse an existing icon temporarily:

```tsx
  icon: '/icons/folder_icon.png', // placeholder
```

Save the file.

**OBSERVE:** Refresh the browser. You should see:

1. A new desktop icon labeled "Calculator" appears on the desktop grid
2. The Start Menu → Programs now lists "Calculator"
3. Clicking either one opens a Calculator window with a working display and buttons
4. The taskbar shows the Calculator when open
5. You can type `open calculator` in the Terminal and it opens

All five integration points work — and you edited zero lines in Desktop.tsx, WindowManager.tsx, Taskbar.tsx, or StartMenu.tsx.

**EXPLAIN:** This is the **Open-Closed Principle** in action. The system is open for extension (new apps) but closed for modification (no changes to existing code). Here's the chain:

1. `registerApp()` adds an entry to `APP_REGISTRY` (a plain object)
2. `Desktop.tsx` calls `getDesktopApps()` which reads from `APP_REGISTRY` — it renders whatever is there
3. `StartMenu.tsx` calls `getStartMenuCategories()` — same registry
4. `WindowManager.tsx` uses `resolveAppComponent()` to look up the component — same registry
5. `TerminalApp.tsx` uses `APP_REGISTRY[target]` for the `open` command — same registry

One `registerApp()` call feeds all four consumers. This is the **Inversion of Control** pattern described in `concepts/inversion-of-control` — the framework calls your code, not the other way around.

## Experiment 3: Test All Access Points

**DO:** Systematically verify each integration point:

1. **Desktop:** Double-click the Calculator icon on the desktop
2. **Start Menu:** Click Start → Programs → Calculator
3. **Terminal:** Open Terminal, type `open calculator`
4. **Window Manager:** Open Calculator, then minimize it from the title bar, then click its taskbar button to restore
5. **Multiple windows:** Since `singleton: true`, try opening it twice — the second attempt should focus the existing window instead of creating a new one

**OBSERVE:** All five interactions work correctly. The singleton behavior prevents duplicate windows. Minimize/restore works through the standard window management. The Calculator participates in z-index ordering (click another window, then click the Calculator — it comes to front).

**EXPLAIN:** The `WindowState` type in `store/types.ts` defines the shape every window must have: id, app, title, icon, position, size, z-index, and minimize/maximize state. The `createDesktopStore` in `desktop-store.ts` manages all of this generically. Your Calculator doesn't need to know about z-indexing, cascading positions, or singleton enforcement — the store handles it based on the `AppRegistryEntry` metadata you provided.

## Experiment 4: Verify the Type Contract

**DO:** Open `src/components/desktop/store/types.ts` and read the `AppRegistryEntry` interface. Compare it to your `registerApp()` call. Try removing a required field (like `singleton`) and check if TypeScript catches it:

```tsx
registerApp({
  id: 'calculator',
  title: 'Calculator',
  icon: '/icons/folder_icon.png',
  component: CalculatorApp,
  desktop: true,
  startMenu: true,
  // singleton: true,  ← commented out
  defaultSize: { width: 250, height: 320 },
});
```

**OBSERVE:** TypeScript immediately reports an error: `Property 'singleton' is missing in type ...`. The type contract enforces that every app provides the metadata the system needs. Optional fields like `startMenuCategory`, `minSize`, `resizable`, and `captureKeyboard` have sensible defaults.

**EXPLAIN:** This is static type safety enforcing the registry contract. The `AppRegistryEntry` type serves as documentation and validation simultaneously. When someone adds a new optional field to the interface (like `openMaximized` or `desktopAlign`), existing apps continue to work because the field is optional, but new apps can opt in.

## Wrap-Up

You built a fully integrated app by creating one component file and adding one `registerApp()` call. The registry pattern — described in `architecture/app-registry` — eliminates the need to touch framework internals. This is the Inversion of Control principle from `concepts/inversion-of-control` made concrete: the framework discovers and manages your app, you just declare its capabilities.

The key insight: the `APP_REGISTRY` object is the single source of truth for app metadata. Desktop, Start Menu, Taskbar, Terminal, and WindowManager all read from it. Adding an app is O(1) in code changes — always one registration, regardless of how many integration points exist.

## Cleanup

```bash
rm src/components/desktop/apps/CalculatorApp.tsx
git checkout -- src/components/desktop/apps/app-manifest.ts
git checkout feat/knowledge-base
git branch -D lab/build-calculator
```
