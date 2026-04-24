---
title: "Lab: Trace a Request End-to-End"
category: lab
summary: "Follow a contact form submission from browser click through Astro endpoint to Resend API, inspecting every layer with DevTools."
difficulty: intermediate
relatedConcepts:
  - concepts/progressive-enhancement
  - concepts/islands-architecture
  - concepts/module-systems-and-bundling
relatedFiles:
  - src/components/desktop/apps/EmailApp.tsx
  - src/components/desktop/apps/ContactApp.tsx
  - src/pages/api/contact.ts
technologies:
  - astro
  - solidjs
  - typescript
order: 4
dateAdded: 2026-04-20
lastUpdated: 2026-04-24
externalReferences:
  - title: "Astro — Server Endpoints (API Routes)"
    url: "https://docs.astro.build/en/guides/endpoints/#server-endpoints-api-routes"
    type: docs
  - title: "Resend — Send Email API Reference"
    url: "https://resend.com/docs/api-reference/emails/send-email"
    type: docs
  - title: "MDN — Fetch API"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API"
    type: docs
  - title: "Resend GitHub Repository"
    url: "https://github.com/resend/resend-node"
    type: repo
  - title: "Endpoints — Astro Docs"
    url: "https://docs.astro.build/en/guides/endpoints/"
    type: docs
prerequisites:
  - architecture/contact-system
  - technologies/resend
learningObjectives:
  - "Trace a full HTTP request lifecycle from client-side fetch() through server-side handler to external API"
  - "Inspect request/response payloads, headers, and status codes using Chrome DevTools Network tab"
  - "Identify where environment variables are resolved at build time vs runtime"
  - "Explain the security decisions in the contact form: honeypot, validation, process.env vs import.meta.env"
exercises: []
estimatedMinutes: 30
module: full-stack
moduleOrder: 99
---

## Why This Lab Exists

Most web developers work on either the frontend or the backend. This codebase has both in one repo: a SolidJS component sends a [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) request to an [Astro server endpoint](https://docs.astro.build/en/guides/endpoints/), which calls the [Resend API](https://resend.com/docs/api-reference/emails/send-email). Understanding this full path — and being able to trace it with DevTools — is a core skill for full-stack work. This lab walks you through every layer.

## Setup

```bash
pnpm dev
```

Open the app in Chrome. You'll need the Network tab and the source code side by side. No branch needed — this lab is read-only observation. You won't modify any files.

**Important:** You don't need real Resend credentials for most of this lab. The server will return a 500 error at the Resend step if credentials are missing, but you can still trace the entire request up to that point.

## Experiment 1: Inspect the Client-Side Submission

**DO:**

1. Open Chrome DevTools → **Network** tab. Check "Preserve log" and clear existing entries
2. Open the Contact Me app from the desktop → click "Send Email" to open the email form
3. Fill in all fields: name, email, subject, and type a message in the rich text editor
4. Click the "✉ Send" button
5. In the Network tab, find the request to `/api/contact`

Click on the request and examine:
- **Headers tab:** Request Method, Content-Type, URL
- **Payload tab:** The JSON body
- **Response tab:** The JSON response

**OBSERVE:** The request is:
- Method: `POST`
- URL: `http://localhost:4321/api/contact`
- Content-Type: `application/json`
- Body: `{ "name": "...", "email": "...", "subject": "...", "message": "...", "website": "" }`

Note the `website` field — it's empty. The response is either `{ "ok": true }` (if Resend is configured) or `{ "ok": false, "error": "Server configuration error" }` (if env vars are missing).

**EXPLAIN:** Open `src/components/desktop/apps/EmailApp.tsx` and find the `handleSubmit` function. It calls:

```tsx
const res = await fetch('/api/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: name(),
    email: email(),
    subject: subject(),
    message: getMessage(),
    website: honeypot(),
  }),
});
```

The `website` field is a **honeypot** — a hidden field that real users never fill in. Bots that auto-fill all form fields will put a value there. The `getMessage()` function reads `innerHTML` from the contentEditable div, so the message includes HTML formatting (bold, italic, etc.).

## Experiment 2: Read the Server Endpoint

**DO:** Open `src/pages/api/contact.ts` in your editor. Read it line by line and trace the execution path for a valid submission. Answer these questions as you read:

1. Why does it export `prerender = false`?
2. What happens if the `website` field has a value?
3. Where does it validate the email format?
4. How does it get the Resend API key?

**OBSERVE:** The file is about 100 lines and handles the entire server side:

1. `export const prerender = false` — this tells Astro this route needs a server at runtime, not static generation. Without it, Astro would try to pre-render the API route at build time, which makes no sense for a POST [endpoint](https://docs.astro.build/en/guides/endpoints/#server-endpoints-api-routes).

2. The honeypot check is on lines that check `body.website` — if it has any value, the server returns `{ ok: true }` with a 200 status. It **silently succeeds** instead of returning an error, so bots think their submission worked.

3. Email validation uses a regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`. It checks after trimming whitespace.

4. The API key comes from `process.env.RESEND_API_KEY` — **not** `import.meta.env`. This is critical.

**EXPLAIN:** The `process.env` vs `import.meta.env` distinction is a major landmine documented in `AGENTS.md`. Vite (which Astro uses) inlines **all** `import.meta.env` values at build time — including server-only secrets. In Docker builds where secrets aren't available during `pnpm build`, `import.meta.env.[RESEND](https://github.com/resend/resend-node)_API_KEY` would become an empty string baked into the JavaScript bundle. Using `process.env.RESEND_API_KEY` reads the environment variable at **runtime**, when the Node.js server actually handles the request. Dot notation and bracket notation both work here; the important rule is that server secrets come from `process.env`.

## Experiment 3: Trace the Resend API Call

**DO:** Read the Resend call in `contact.ts`:

```tsx
const resend = new Resend(apiKey);
const { error } = await resend.emails.send({
  from: `CV Contact <${fromEmail}>`,
  to: toEmail,
  replyTo: email,
  subject: `[CV Contact] ${subject}`,
  html: `<p><strong>From:</strong> ${name} (${email})</p><hr/>${message}`,
  text: `From: ${name} (${email})\n\n${plainText}`,
});
```

Note the error handling pattern:

```tsx
if (error) {
  console.error('[contact] Resend error:', JSON.stringify(error));
  // return 500
}
```

**OBSERVE:** The Resend SDK returns `{ data, error }` — it does **not** throw exceptions. This is unlike most HTTP libraries. The code destructures `error` and checks it explicitly. There's no `try/catch` around the Resend call itself (only around `request.json()` parsing earlier).

Also note: the `from` address uses the `CONTACT_FROM_EMAIL` env var, which must match a domain verified in Resend. The `replyTo` is set to the user's email address — so when you reply to the notification, it goes to the person who filled the form, not to the system address.

**EXPLAIN:** The `{ data, error }` pattern is Resend's API contract. If you wrapped it in `try/catch`, you'd never catch API errors — they come back as `error` objects, not exceptions. Only network failures (DNS resolution, timeout) would throw. The AGENTS.md explicitly warns: "The Resend SDK returns `{ data, error }` — it does NOT throw."

## Experiment 4: Trace Environment Variable Resolution

**DO:** Map out exactly where each environment variable is read and when:

1. `PUBLIC_TELEGRAM_USERNAME` — used in `ContactApp.tsx` and `EmailApp.tsx` via `import.meta.env.PUBLIC_TELEGRAM_USERNAME`. Search the codebase:

```bash
grep -r "PUBLIC_TELEGRAM" src/
```

2. `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` — used only in `src/pages/api/contact.ts` via `process.env`.

3. Check the Dockerfile to see how `PUBLIC_*` vars are handled during Docker build:

```bash
grep -A2 "PUBLIC_" Dockerfile
```

**OBSERVE:** The `PUBLIC_*` vars appear in the Dockerfile as both `ARG` and `ENV` — they need to be available during the Docker build step because Vite inlines them. The server-only vars (`RESEND_API_KEY` etc.) don't appear in the Dockerfile at all — they're set as runtime environment variables in Railway.

**EXPLAIN:** This is the two-tier environment variable system:

- **Build time** (`import.meta.env`): `PUBLIC_*` vars. Vite replaces them with literal strings in the JavaScript bundle. Must be available when `pnpm build` runs. In Docker, this means `ARG` + `ENV` in the Dockerfile.
- **Runtime** (`process.env`): Server-only secrets. Read when the Node.js server handles each request. Set as environment variables in the deployment platform (Railway). Never appear in client-side code.

If you accidentally used `import.meta.env.RESEND_API_KEY` in the API route, the API key would be baked into the server bundle at build time — and if the build environment doesn't have it, it'd be an empty string at runtime.

## Experiment 5: Inspect Validation Layers

**DO:** Try submitting the form with various invalid inputs and trace each validation:

1. Submit with an empty message body — what happens?
2. Submit with an invalid email like "notanemail" — what response code?
3. Open DevTools Console and manually send a request with the honeypot filled:

```js
fetch('/api/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Bot', email: 'bot@test.com',
    subject: 'Spam', message: 'Buy now!',
    website: 'http://spam.com'
  })
}).then(r => r.json()).then(console.log);
```

**OBSERVE:** The honeypot request returns `{ ok: true }` with status 200 — silent success. Invalid email returns `{ ok: false, error: "Invalid email format" }` with status 400. Missing fields return `{ ok: false, error: "All fields are required" }` with status 400.

**EXPLAIN:** The validation is layered: client-side HTML validation (required attributes) provides UX feedback, server-side validation in `contact.ts` provides security. The honeypot is server-side only — no client validation reveals its existence. This defense-in-depth approach means that even if someone bypasses the client-side form, the server still validates everything.

## Wrap-Up

You've traced a single request through four layers:

1. **SolidJS component** (`EmailApp.tsx`) — collects form data, calls `fetch()`
2. **Astro server endpoint** (`contact.ts`) — validates, checks honeypot, reads env vars
3. **Resend SDK** — sends the email via Resend's REST API
4. **Environment variables** — split between build-time (`import.meta.env`) and runtime (`process.env`)

The architecture articles `architecture/contact-system` and `technologies/resend` describe this system at a higher level. Now you've seen every line of code that executes when someone clicks "Send." This kind of end-to-end tracing is essential for debugging production issues — when an email doesn't arrive, you need to know which layer failed.

## Cleanup

No cleanup needed — this lab was read-only observation. No files were modified.
