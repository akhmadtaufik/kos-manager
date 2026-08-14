# ===========================
# Stage 1: Builder
# ===========================
FROM node:24-alpine AS builder

WORKDIR /app

ARG CI
ENV CI=${CI}

# Copy package files
COPY package.json package-lock.json* ./
COPY scripts/patch-compiler-sfc.cjs ./scripts/

# Install build tools and dependencies
RUN apk add --no-cache python3 make g++
RUN npm install --legacy-peer-deps && npm cache clean --force

COPY . .

# Build the Nuxt application
RUN npm run build

# ===========================
# Stage 3: Production Runner
# ===========================
FROM node:24-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 kosmanager && \
    adduser --system --uid 1001 kosmanager

# Copy built application from builder stage
COPY --from=builder /app/.output ./.output

# Set environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Switch to non-root user
USER kosmanager

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", ".output/server/index.mjs"]
