# Production Dockerfile for Ishant's Portfolio Backend & Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm ci

# Copy full application code and build Vite static bundle
COPY . .
ARG BUILD_DATE=2026-09-03T10:34:00Z
RUN npm run build

# Production runtime container
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled frontend and server
COPY --from=builder /app/dist ./dist
COPY server ./server
COPY public ./public

# Persistent admin data: settings, filesystem.json, master-snapshot.json,
# snapshots/ and uploads/. This MUST be backed by a volume mounted at
# /app/data in Dokploy — the declaration below documents the contract but
# does not create the mount. Without it every redeploy destroys the lot.
RUN mkdir -p /app/data
VOLUME ["/app/data"]

EXPOSE 3000

# Run Express server that handles /api/settings and serves the web app
CMD ["node", "server/index.js"]
