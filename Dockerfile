# ==========================================
# STAGE 1 : BUILDER
# ==========================================

FROM node:22.20.0-bookworm-slim AS builder

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer toutes les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Générer le client Prisma
RUN npx prisma generate


# ==========================================
# STAGE 2 : PRODUCTION
# ==========================================

FROM node:22.20.0-bookworm-slim AS production

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer uniquement les dépendances de production
RUN npm ci --omit=dev && npm cache clean --force

# Copier les fichiers nécessaires depuis le builder
COPY --from=builder --chown=node:node /app/src ./src
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma

# Utilisateur non privilégié
USER node

EXPOSE 3000

CMD ["npm", "start"]
