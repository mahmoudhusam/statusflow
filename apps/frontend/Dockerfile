FROM node:20-alpine AS builder
WORKDIR /app

COPY . .

RUN npm config set fetch-retry-maxtimeout 600000 \
    && npm config set fetch-retries 5 \
    && npm ci

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build + normalize Next static output into /app/__next_static
RUN npx turbo run build --filter=frontend \
    && mkdir -p /app/__next_static \
    && if [ -d /app/apps/frontend/.next/static ]; then cp -a /app/apps/frontend/.next/static/. /app/__next_static/; \
    elif [ -d /app/.next/static ]; then cp -a /app/.next/static/. /app/__next_static/; \
    else echo "ERROR: .next/static not found"; find /app -maxdepth 5 -type d -name static -o -name standalone; exit 1; fi

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./

# Copy normalized static output (this is what was failing on Coolify)
COPY --from=builder --chown=nextjs:nodejs /app/__next_static ./apps/frontend/.next/static

USER nextjs
EXPOSE 3001

ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

CMD ["node", "apps/frontend/server.js"]