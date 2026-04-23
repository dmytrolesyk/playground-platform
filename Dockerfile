FROM node:24-slim AS base
RUN corepack enable

WORKDIR /app

# Install dependencies — copy workspace config + all package.json files
# so pnpm can resolve workspace links and install sub-package deps (e.g. zod).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/knowledge-engine/package.json ./packages/knowledge-engine/
RUN pnpm install --frozen-lockfile

# Build
COPY . .

# PUBLIC_* vars must be present at build time for Astro/Vite to inline them.
# Railway passes service variables as build args automatically.
ARG PUBLIC_TELEGRAM_USERNAME
ENV PUBLIC_TELEGRAM_USERNAME=$PUBLIC_TELEGRAM_USERNAME

RUN pnpm build

# Production
FROM node:24-slim AS runtime
WORKDIR /app

COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY package.json ./

ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/server/entry.mjs"]
