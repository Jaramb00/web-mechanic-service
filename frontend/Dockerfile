# --- Faza gradnje -----------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# VITE_* varijable se ugrađuju u build, pa moraju biti poznate ovdje, a ne pri
# pokretanju kontejnera.
ARG VITE_API_BASE_URL=""
ARG VITE_ANALYTICS_ID=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_ANALYTICS_ID=$VITE_ANALYTICS_ID
RUN npm run build

# --- Faza posluživanja ------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
  CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
