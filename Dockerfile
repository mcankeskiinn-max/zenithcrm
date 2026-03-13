# Multi-stage build for optimized production image
FROM node:20-bullseye-slim AS builder

WORKDIR /app

# System deps for Prisma engine detection
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY server/package*.json ./
RUN npm ci

# Copy prisma schema and generate client
COPY server/prisma ./prisma
RUN npx prisma generate

# Copy source code
COPY server/src ./src
COPY server/tsconfig.json ./

# Build TypeScript
RUN npx tsc

# Production stage
FROM node:20-bullseye-slim

WORKDIR /app

# System deps for Prisma engine usage at runtime
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy dependencies from builder (includes Prisma CLI/runtime)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Copy package.json for scripts
COPY server/package*.json ./

# Expose port
EXPOSE 3000

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
