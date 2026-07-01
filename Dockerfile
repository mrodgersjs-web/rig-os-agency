# ── RIG OS Agency — Multi-stage Dockerfile ──────────────────────────
# Production image for Railway / Docker / self-hosted deployment.
# Next.js 16 standalone output → tiny final image.

# ── Stage 1: Dependencies ──────────────────────────────────────────
FROM node:22-slim AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --include=dev || npm install

# ── Stage 2: Build ──────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env (no secrets needed at build)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ── Stage 3: Production ─────────────────────────────────────────────
FROM node:22-slim AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3737
ENV HOSTNAME=0.0.0.0

# Non-root user for security
RUN addgroup --system --gid 1001 rigos && \
    adduser --system --uid 1001 --ingroup rigos rigos

# Copy standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Create data directory with write permissions
RUN mkdir -p /app/data && chown -R rigos:rigos /app/data

# Copy entrypoint script and fix permissions
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# Copy any needed config
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/package.json ./

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3737/api/health').then(r=>{if(!r.ok)throw r.status}).catch(()=>process.exit(1))"

USER rigos
EXPOSE 3737

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "server.js"]