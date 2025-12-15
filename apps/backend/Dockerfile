FROM node:20-alpine AS builder
WORKDIR /app

COPY . .

RUN npm config set fetch-retry-maxtimeout 600000 \
    && npm config set fetch-retries 5 \
    && npm ci

RUN cd apps/backend && npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nestjs \
    && apk add --no-cache curl

COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/package.json ./

USER nestjs
EXPOSE 3000

CMD ["sh", "-c", "node dist/main.js || node dist/src/main.js"]