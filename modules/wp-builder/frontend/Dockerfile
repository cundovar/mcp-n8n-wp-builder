# Build: `docker build -f Dockerfile -t wp-builder-frontend .` (context = ce dossier)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# VITE_API_URL est injecté au build (Vite inline les env au bundle, pas au runtime) :
# pointe vers le même domaine public, filtré par chemin côté Traefik (voir
# /srv/config/mcp-n8n-wp-builder/docker-compose.yml).
ARG VITE_API_URL=https://wp-builder.varascundo.com
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
