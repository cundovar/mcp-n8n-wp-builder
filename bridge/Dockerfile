# Build context = racine du repo, PAS bridge/.
# bridge/src/server.js importe ../../modules/wp-builder/backend/routes/* :
# l'image doit contenir les deux arbres.
#   docker build -f bridge/Dockerfile -t mcp-bridge .
FROM node:22-alpine

# Les CLI que le bridge spawne. git est requis par codex/claude pour operer
# sur un depot ; wget sert au healthcheck du compose.
RUN apk add --no-cache git wget \
    && npm i -g @openai/codex@0.147.0 @anthropic-ai/claude-code \
    && npm cache clean --force

WORKDIR /app

# Deux npm ci distincts : modules/wp-builder/backend importe mongoose, et la
# resolution Node cherche dans modules/wp-builder/node_modules, jamais dans
# bridge/node_modules. Copie des manifests d'abord pour garder le cache.
COPY bridge/package.json bridge/package-lock.json ./bridge/
RUN cd bridge && npm ci --omit=dev

COPY modules/wp-builder/package.json modules/wp-builder/package-lock.json ./modules/wp-builder/
RUN cd modules/wp-builder && npm ci --omit=dev

COPY bridge/ ./bridge/
COPY modules/wp-builder/ ./modules/wp-builder/

COPY bridge/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# uid 1000, aligne sur l'utilisateur cundo de l'hote pour les montages :ro
# de ~/.claude et ~/.codex.
RUN chown -R node:node /app
USER node

ENV NODE_ENV=production \
    WORKSPACE_ROOT=/workspace

WORKDIR /app/bridge
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
