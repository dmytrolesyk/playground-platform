---
title: "Resend — Transactional Email"
category: technology
summary: "The email API used by the contact form — simple SDK, process.env for secrets, and the error handling pattern."
difficulty: beginner
technologies:
  - resend
order: 5
dateAdded: 2026-04-20
externalReferences:
  - title: "Resend Documentation"
    url: "https://resend.com/docs"
    type: docs
  - title: "Resend Node.js SDK"
    url: "https://github.com/resend/resend-node"
    type: repo
---

## What Resend Does

Resend is an email API for developers. You send an HTTP request with from/to/subject/html, and Resend delivers the email. No SMTP configuration, no email server to manage.

## How We Use It

The `/api/contact` endpoint creates a Resend client and sends email:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env['RESEND_API_KEY']);

const { data, error } = await resend.emails.send({
  from: process.env['CONTACT_FROM_EMAIL'],
  to: process.env['CONTACT_TO_EMAIL'],
  subject: `Contact: ${subject}`,
  html: `<p>From: ${name} (${email})</p><p>${message}</p>`,
});
```

## Critical Gotchas

### 1. process.env, Not import.meta.env

All Resend secrets must use `process.env['VAR_NAME']`, not `import.meta.env`. Vite inlines `import.meta.env` at build time — in Docker builds where secrets aren't present, they become empty strings.

### 2. Error Handling

Resend returns `{ data, error }` — it does **not** throw:

```typescript
if (error) {
  // Handle error — always check explicitly
  console.error('Resend error:', error);
  return new Response(JSON.stringify({ ok: false }), { status: 500 });
}
```

Do not wrap Resend calls in try/catch expecting thrown errors. The SDK signals failure through the return value.

### 3. Domain Matching

The `from` address domain must exactly match the verified Resend domain. If your domain is `example.com`, the from address must be `something@example.com`.

## Environment Variables

| Variable | Purpose | Where Used |
|---|---|---|
| `RESEND_API_KEY` | API authentication | Server only (process.env) |
| `CONTACT_TO_EMAIL` | Recipient address | Server only (process.env) |
| `CONTACT_FROM_EMAIL` | Sender address | Server only (process.env) |
