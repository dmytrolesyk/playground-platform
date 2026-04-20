---
title: "The Contact System"
category: architecture
summary: "How the contact form sends email via Resend — the SSR endpoint, environment variables, and the process.env landmine."
difficulty: intermediate
relatedConcepts:
  - concepts/islands-architecture
relatedFiles:
  - src/pages/api/contact.ts
  - src/components/desktop/apps/EmailApp.tsx
  - src/components/desktop/apps/ContactApp.tsx
technologies:
  - resend
  - astro
order: 6
dateAdded: 2026-04-20
---

## Architecture

The contact flow has three components:

1. **ContactApp** — a chooser dialog ("Email" or "Telegram") that opens the appropriate channel
2. **EmailApp** — a form with name, email, subject, and message fields
3. **/api/contact** — an SSR endpoint that sends email via the Resend SDK

## The process.env Landmine

This is the most dangerous gotcha in the codebase. Vite (used by Astro) inlines **all** `import.meta.env` values at build time — not just `PUBLIC_*` ones. In Docker/CI builds where secrets aren't present during `pnpm build`, they become empty strings permanently baked into the output.

**Wrong:**
```typescript
const apiKey = import.meta.env.RESEND_API_KEY; // "" in Docker!
```

**Correct:**
```typescript
const apiKey = process.env['RESEND_API_KEY']; // Read at runtime
```

Server-side endpoints must use `process.env['VAR_NAME']` with bracket notation (required by `noPropertyAccessFromIndexSignature`). Only client-side code should use `import.meta.env` for `PUBLIC_*` vars.

## The Resend SDK Pattern

The Resend SDK returns `{ data, error }` — it does **not** throw:

```typescript
const { data, error } = await resend.emails.send({
  from: process.env['CONTACT_FROM_EMAIL'],
  to: process.env['CONTACT_TO_EMAIL'],
  subject: `Contact: ${subject}`,
  html: `<p>From: ${name} (${email})</p><p>${message}</p>`,
});

if (error) {
  // Handle error — do NOT use try/catch for Resend API errors
  return new Response(JSON.stringify({ ok: false }), { status: 500 });
}
```

## SSR vs Static

The `/api/contact` endpoint is the only SSR route in the entire application. Everything else is static (prerendered at build time). This endpoint uses `export const prerender = false` to opt out of static rendering.
