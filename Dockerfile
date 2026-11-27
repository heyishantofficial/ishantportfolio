# heyishant.com: Next.js static export served by a small Express server.
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
# --include=dev: the build needs Next and Tailwind even if NODE_ENV=production is set.
RUN npm ci --include=dev
COPY . .
# Preview builds pass NEXT_PUBLIC_DRAFT=1 to show "needs from you" notes.
ARG NEXT_PUBLIC_DRAFT=0
ENV NEXT_PUBLIC_DRAFT=$NEXT_PUBLIC_DRAFT NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
# The CMS (/admin) encodes uploaded videos and photos on the server.
RUN apk add --no-cache ffmpeg libwebp-tools
ENV NODE_ENV=production PORT=3000 DATA_DIR=/app/data
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/out ./out
COPY server ./server
# Videos (media/) and the old site's files (uploads/) live here. In Dokploy this
# MUST be a mounted volume, or every redeploy loses the media.
RUN mkdir -p /app/data/media
VOLUME ["/app/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "server/index.js"]
