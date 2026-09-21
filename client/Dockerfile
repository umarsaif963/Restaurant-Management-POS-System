# Client Dockerfile - builds the static bundle and serves it via nginx.

# --- Build stage ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY client/package.json client/
RUN npm ci || npm install

COPY shared/ shared/
COPY client/ client/

RUN npm run build -w @restaurant/shared
RUN npm run build -w @restaurant/client

# --- Serve stage ---
FROM nginx:alpine
COPY --from=build /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]