# Server Dockerfile for production builds (Module 1 baseline).
# Extended in later modules once Prisma/generated clients are added.

# --- Build stage ---
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies (workspace-aware)
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci || npm install

# Copy sources
COPY shared/ shared/
COPY server/ server/

# Build shared package first, then server
RUN npm run build -w @restaurant/shared
RUN npm run build -w @restaurant/server

# --- Run stage ---
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/package.json package.json
COPY --from=build /app/shared/package.json shared/package.json
COPY --from=build /app/shared/dist shared/dist
COPY --from=build /app/server/package.json server/package.json
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/node_modules node_modules

WORKDIR /app/server
EXPOSE 4000

CMD ["node", "dist/server.js"]