---
title: 'Experience'
order: 2
---

## Employment History

### Frontend Engineer — DataArt
*April 2019 — Present*

DataArt is a global enterprise software development company. I have been working there as a frontend engineer for more than seven years and during this time participated in developing a number of products in different spheres, including publishing, musical industry and insurance, and had experience with different tech stacks.

#### Current Project — Headless E-commerce Platform

A single-locale e-commerce storefront built with Astro on Cloudflare Workers, backed by headless WooCommerce/WordPress and a headless CMS. Alongside feature delivery I took ownership of the platform's security, observability, performance and CI/CD quality tracks.

**Security hardening**

- Ran an end-to-end audit of authentication across the storefront and the headless WordPress backend, triggered by a bug that revealed auth was gated on cookie *presence* rather than validity. Produced 31 findings (3 critical, 6 high) plus a companion best-practices research document, and turned them into a 19-ticket remediation epic that I then delivered
- Re-architected authentication onto a BFF (backend-for-frontend) session model, moving tokens out of JS-readable cookies and closing an XSS → account-takeover path; subsequently deleted the legacy JWT-cookie transport entirely
- Implemented CSRF protection at the BFF using a synchronizer-token pattern with `__Host-`-prefixed cookies and KV-backed state, including self-healing when a cookie is evicted
- Hardened client-side auth state with a central cleanup registry, consistent 401 handling and validity-based route gating
- Hardened the CI/CD supply chain: SHA-pinned every GitHub Actions reference, added a gating workflow-security scanner, disabled credential persistence across checkouts, added Dependabot cooldowns, and set up diff-aware Semgrep SAST on pull requests with full scans on merge and a weekly cron
- Ran a spike on the framework's built-in CSP support and documented why it could not be adopted yet (no report-only mode, adapter gaps, view-transitions incompatibility) with explicit revisit triggers; fixed a `Permissions-Policy` header that was silently blocking our own geolocation feature

**Observability, from zero**

- Took over a write-only telemetry pipeline — solid OpenTelemetry instrumentation on Cloudflare Workers, but zero dashboards, alerts or uptime checks — and built the entire operational layer on top of it
- Built per-environment dashboards for SSR and upstream health, errors, and Core Web Vitals, together with derived span metrics, all defined as code
- Added alert rules including anomaly detection on checkout and auth traffic, per-environment escalation policies, uptime monitors and a public status page
- Managed the whole observability estate as infrastructure-as-code with OpenTofu and encrypted remote state, and migrated it from a personal to a corporate vendor account with a documented cutover runbook
- Instrumented user-journey timings and web-vitals attribution; root-caused a null-metrics bug down to the vendor's ingestion layer silently nulling 17-significant-digit JSON numbers, and fixed it with a precision clamp in the performance sink

**Performance**

- Split the HTTP service layer so the server-side data-fetching runtime stopped shipping to the browser, reducing the client bundle by 55%
- Re-triaged a stale performance-audit epic against the current codebase, closing 6 of 7 tickets with measured evidence and rewriting the remaining one as a post-remediation re-measurement
- Diagnosed and fixed recurring duplicate-React-instance failures caused by dependency-optimizer races and CMS-plugin module de-duplication
- Adopted Knip for dead-code detection, removing 85 unused files and 356 unused exports

**Code quality, CI and developer experience**

- Adopted TypeScript's `exactOptionalPropertyTypes` across the monorepo, fixing roughly 180 type errors with zero `as`, `!` or `@ts-*` suppressions
- Drove the ESLint warning tier down from 113 warnings to 6 and promoted previously deferred rule classes to errors
- Closed missing CI gates (formatting, CMS typegen drift) and built a content-parity pre-flight check that blocks a release candidate when the production CMS dataset lacks content the deployed code needs, plus an additive, revision-guarded promotion tool to resolve it
- Wrote a custom ESLint rule banning module-level CMS-client imports, backed by an 18-case rule-tester suite
- Authored an E2E testing strategy from a five-stream audit (unit-test value, execution-path coverage, a 277-bug tracker audit, best-practice research and tooling discovery) and decomposed it into a 14-task delivery program
- Isolated the production Cloudflare Worker from staging, migrated the monorepo to pnpm 11 with exact Node and toolchain pins, and root-caused a recurring CI flake to an out-of-memory crash in CMS schema extraction

**Feature work**

- Built a greenfield store locator: search, Google Maps integration, current-location lookup, postal-code-to-coordinates resolution and a per-account saved store
- Shipped loyalty-tier cart validation and a range of checkout and account fixes against a third-party payment integration

#### Other Highlights

- Built complex UI
- Participated in building a robust publishing system based on Next.js and WordPress and integrating VOD and live streaming features using JW Player
- Took part in creating a custom testing framework based on Cypress for testing analytics. I created a solution that automated mocks gathering that used to be done manually before that and consumed a lot of time and efforts
- Performed a significant optimization of a Next.js application, reducing its JavaScript bundle size by 60%, cutting off unused CSS, helping DevOps team integrating CDN for static assets, integrating Redis for caching API calls
- Integrated a number of 3rd party services, including payment providers
- Created custom Webpack plugins from scratch to address project-specific build requirements
- Helped my colleagues with preparation for client interviews

### Customer Support Specialist — Cloudbeds
*February 2018 — November 2018*

Cloudbeds is a software company building hospitality management solutions. My role there was to provide customer support to users over phone calls and email correspondence.

### Customer Support Specialist — Namecheap
*January 2015 — October 2017*

Namecheap is an American ICANN-accredited domain name registrar and web hosting company. My job there was to provide top-notch customer support over chats, email correspondence and phone calls to clients all over the world.
