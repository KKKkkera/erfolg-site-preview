# syntax=docker/dockerfile:1

# ---- Stage 1: deps ----
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ---- Stage 2: builder ----
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* инлайнятся в клиентский бандл на этапе build — прокидываем как build-arg,
# иначе флаги (формы/индексация) не попадут в UI и будут игнорироваться на клиенте.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_FORMS_DISABLED
ARG NEXT_PUBLIC_SEO_BLOCK_INDEX
# next.config.mjs отключает каталог редиректом, если на сборке нет DATABASE_URL.
# К базе тут никто не ходит — важен лишь непустой признак, что она настроена.
ARG DATABASE_URL
# SITE_URL тоже нужен на билде: из него собираются canonical, og:url и sitemap.
# Без него в бандл уезжает значение из .env разработчика (там localhost:3000).
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_FORMS_DISABLED=$NEXT_PUBLIC_FORMS_DISABLED
ENV NEXT_PUBLIC_SEO_BLOCK_INDEX=$NEXT_PUBLIC_SEO_BLOCK_INDEX
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma generate
# Потолок кучи V8 на время сборки: на 2-гигабайтном сервере без него Node
# разрастается, пока не начнётся своп, и машина перестаёт отвечать.
#
# ВАЖНО (Next 16): сборка идёт Turbopack'ом, у которого нет однопоточного
# режима — прежний experimental.cpus в next.config больше не действует, и
# нативная часть Rust живёт вне этого потолка. Собирать образ на 2 ГБ
# сервере теперь рискованно: собирайте локально или в CI и пушьте готовый
# образ в реестр.
ENV NODE_OPTIONS=--max-old-space-size=1024
RUN npm run build

# ---- Stage 3: runner ----
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
