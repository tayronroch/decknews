FROM node:24-alpine AS base

WORKDIR /app
RUN corepack enable && apk add --no-cache libc6-compat

FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY config ./config
RUN pnpm install --frozen-lockfile

FROM dependencies AS build

COPY . .
ENV DATABASE_URL=postgresql://build:build@localhost:5432/decknews?schema=public
ENV PASSWORD_PEPPER=build-time-placeholder-not-a-secret
RUN pnpm prisma generate && pnpm build

FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN corepack enable \
  && apk add --no-cache libc6-compat \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=build --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build --chown=nextjs:nodejs /app/infra/scripts/bootstrap-admin.mjs ./infra/scripts/bootstrap-admin.mjs

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
