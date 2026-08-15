# ===========================
# Stage 1: Builder
# ===========================
FROM node:24-alpine AS builder

WORKDIR /app

ARG CI
ENV CI=${CI}
ENV NUXT_TELEMETRY_DISABLED=1

# Build tools required for bcrypt and other native modules
RUN apk add --no-cache python3 make g++

# Copy only package.json first (better layer caching — reinstall only when deps change)
COPY package.json ./
COPY scripts/ ./scripts/

# Install dependencies without cross-platform lockfile
# --legacy-peer-deps: resolves peer dep conflicts in this project
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Copy rest of source (after install for optimal cache hit)
COPY . .

# Build the Nuxt application
RUN NODE_ENV=production npm run build

# ===========================
# Stage 2: Production Runner
# ===========================
FROM node:24-alpine AS runner

WORKDIR /app

# Non-root user for security
RUN addgroup --system --gid 1001 kosmanager && \
    adduser --system --uid 1001 kosmanager

# Only the compiled output is needed at runtime
COPY --from=builder /app/.output ./.output

# Nuxt/Nitro reads NITRO_PORT and NITRO_HOST (not PORT)
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

USER kosmanager

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
