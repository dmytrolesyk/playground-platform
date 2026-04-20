---
title: "98.css — Windows 98 in Pure CSS"
category: technology
summary: "The CSS library that provides the Win98 aesthetic — how it works, what it styles, and why we don't override it."
difficulty: beginner
technologies:
  - 98css
order: 3
dateAdded: 2026-04-20
externalReferences:
  - title: "98.css Documentation"
    url: "https://jdan.github.io/98.css/"
    type: docs
  - title: "98.css GitHub Repository"
    url: "https://github.com/jdan/98.css"
    type: repo
---

## What 98.css Does

98.css is a CSS-only library that makes HTML elements look like Windows 98 UI components. No JavaScript. Just semantic CSS classes.

## What It Styles

| Element | How to Use |
|---|---|
| Windows | `<div class="window">` with `.title-bar`, `.title-bar-text`, `.title-bar-controls` |
| Buttons | Plain `<button>` elements — automatically styled |
| Text inputs | Plain `<input type="text">` — sunken field style |
| Select boxes | Plain `<select>` — dropdown with Win98 arrow |
| Status bars | `<div class="status-bar">` with `.status-bar-field` |
| Trees | `<ul role="tree">` with tree-view styling |
| Tabs | Tab strip styling |
| Progress bars | `<div role="progressbar">` |

## The Rule: 98.css Is Law

From AGENTS.md: *"Do not write custom CSS for any element 98.css already styles. Use the 98.css semantic classes. Custom CSS is only for layout positioning."*

This means:
- **Don't** override button styles, title bar colors, or input appearances
- **Do** use custom CSS for: desktop grid layout, taskbar positioning, window `transform: translate()`, CRT frame effects

## How It's Used in This Project

```tsx
// Window title bar — all from 98.css
<div class="title-bar">
  <div class="title-bar-text">{title}</div>
  <div class="title-bar-controls">
    <button aria-label="Minimize" />
    <button aria-label="Maximize" />
    <button aria-label="Close" />
  </div>
</div>

// Status bar — from 98.css
<div class="status-bar">
  <p class="status-bar-field">Document: Done</p>
</div>
```

No custom CSS needed for any of these — 98.css handles the 3D borders, button states, and colors.
