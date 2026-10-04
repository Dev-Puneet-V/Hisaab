# ----------------------------------------------------
# 1. Build Stage
# ----------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code and configs
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript
RUN npm run build

# Prune dev dependencies for production
RUN npm prune --production

# ----------------------------------------------------
# 2. Production Stage
# ----------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Security: Run as non-root user 'node'
USER node

# Copy production artifacts from builder
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/src/db/migrations ./dist/db/migrations

EXPOSE 3000

CMD ["node", "dist/server.js"]
