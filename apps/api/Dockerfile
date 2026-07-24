# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=22.16.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="NestJS/Prisma"

# NestJS/Prisma app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"


# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp openssl pkg-config python-is-python3

# 1. Copia os arquivos do monorepo necessários para instalar dependências
COPY package.json yarn.lock ./

# 2. Copia os manifests de cada workspace (necessário para yarn workspaces resolver as deps)
COPY apps/api/package.json apps/api/
COPY apps/frontend/package.json apps/frontend/

# 3. Copia o schema do Prisma antes de instalar (o postinstall roda prisma generate)
COPY apps/api/prisma ./apps/api/prisma/

# 4. Instala as dependências com yarn (respeita o lockfile do monorepo)
RUN yarn install --frozen-lockfile --production=false

# 5. Copia o restante do código da aplicação
COPY . .

# 6. Build da aplicação
RUN yarn workspace api build
RUN cd apps/api && npx prisma migrate deploy

# Final stage for app image
FROM base

# Install packages needed for deployment
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y ca-certificates openssl wget && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Install litestream
RUN wget https://github.com/benbjohnson/litestream/releases/download/v0.3.13/litestream-v0.3.13-linux-amd64.deb && \
    dpkg -i litestream-v0.3.13-linux-amd64.deb && \
    rm litestream-v0.3.13-linux-amd64.deb

# Copy built application
COPY --from=build /app /app

# Setup sqlite3 on a separate volume
RUN mkdir -p /data
VOLUME /data

EXPOSE 3000
ENV DATABASE_URL="file:///data/sqlite.db"

# Entrypoint prepares the database (runs Prisma migrations, then starts the app)
COPY apps/api/docker-entrypoint.js /app/docker-entrypoint.js
RUN chmod +x /app/docker-entrypoint.js

# ENTRYPOINT ["node", "/app/docker-entrypoint.js"]
CMD ["node", "apps/api/dist/main.js"]
