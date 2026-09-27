# Server Dockerfile for production builds

# --- Build stage ---
FROM node:22-alpine AS build

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json ./

# Copy workspace package files
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/

# Install dependencies
RUN npm ci

# Copy source files
COPY shared/ shared/
COPY server/ server/

# Generate Prisma Client
RUN npx prisma generate --schema=server/prisma/schema.prisma

# Build shared package first
RUN npm run build -w @restaurant/shared

# Build server
RUN npm run build -w @restaurant/server


# --- Production runtime stage ---
FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Copy root package file
COPY --from=build /app/package.json package.json

# Copy shared package
COPY --from=build /app/shared/package.json shared/package.json
COPY --from=build /app/shared/dist shared/dist

# Copy server package and compiled code
COPY --from=build /app/server/package.json server/package.json
COPY --from=build /app/server/dist server/dist

# Copy Prisma schema and migrations
COPY --from=build /app/server/prisma server/prisma

# Copy installed dependencies including generated Prisma Client
COPY --from=build /app/node_modules node_modules

WORKDIR /app/server

# Application port
EXPOSE 4000

# Start production server
CMD ["node", "dist/server.js"]