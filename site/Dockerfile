# The Mystery Rooms web app. Build from the repo root:
#   docker build -f site/Dockerfile -t mystery-rooms .

# 1. the game: game/src -> game/dist/site (play.html, voices, rooms.json)
FROM node:22-bookworm-slim AS game
RUN apt-get update && apt-get install -y --no-install-recommends python3 && rm -rf /var/lib/apt/lists/*
WORKDIR /repo
COPY game/build.py game/build.py
COPY game/src game/src
RUN python3 game/build.py site

# 2. server dependencies
FROM node:22-bookworm-slim AS deps
WORKDIR /app/site
COPY site/package.json site/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# 3. the running image
FROM node:22-bookworm-slim
ARG APP_VERSION=dev
ENV NODE_ENV=production PORT=3000 GAME_DIR=../game/dist/site APP_VERSION=${APP_VERSION}
WORKDIR /app/site
COPY --from=deps /app/site/node_modules ./node_modules
COPY site/package.json ./
COPY site/src ./src
COPY site/public ./public
COPY --from=game /repo/game/dist/site /app/game/dist/site
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "src/server.js"]
