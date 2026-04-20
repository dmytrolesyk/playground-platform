FROM node:22-slim AS base
RUN corepack enable

WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build
COPY . .
RUN pnpm build

# Production
FROM node:22-slim AS runtime
WORKDIR /app

COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY package.json ./

ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/server/entry.mjs"]
