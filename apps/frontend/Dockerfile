FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN npm ci --workspace apps/frontend

COPY apps/frontend ./apps/frontend

# VITE_API_URL passed at build time via --build-arg
ARG VITE_API_URL
ARG VITE_API_BASE_URL
ARG VITE_SITE_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SITE_URL=$VITE_SITE_URL

RUN npm --workspace apps/frontend run build

# -- Production image: Nginx serves the built files ---------------------------
FROM nginx:1.27-alpine

COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# SPA fallback: all routes -> index.html
RUN echo 'server { \
  listen 80; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { try_files $uri $uri/ /index.html; } \
  gzip on; \
  gzip_types text/plain text/css application/json application/javascript; \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
