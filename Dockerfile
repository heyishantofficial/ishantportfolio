# Production Dockerfile for Ishant's Portfolio Backend & Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm ci

# Copy full application code and build Vite static bundle
COPY . .
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

# Create data directory for persistent settings
RUN mkdir -p /app/data

EXPOSE 3000

# Run Express server that handles /api/settings and serves the web app
CMD ["node", "server/index.js"]
