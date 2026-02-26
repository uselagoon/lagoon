ARG LAGOON_GIT_BRANCH
ARG UPSTREAM_REPO
ARG UPSTREAM_TAG

# STAGE 1: Install dependencies
FROM ${UPSTREAM_REPO:-uselagoon}/node-22-builder:${UPSTREAM_TAG:-latest} AS builder

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# STAGE 2: API service image
FROM ${UPSTREAM_REPO:-uselagoon}/node-22:${UPSTREAM_TAG:-latest}

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

WORKDIR /app

# Copy installed node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy all service files
COPY . .

# Making sure we run in production
ENV NODE_ENV=production \
    LOGSDB_ADMIN_PASSWORD=admin \
    ELASTICSEARCH_URL=http://logs-db-service:9200 \
    KEYCLOAK_API_CLIENT_SECRET=39d5282d-3684-4026-b4ed-04bbc034b61a \
    KEYCLOAK_ADMIN_API_CLIENT_SECRET=bb86d344-a52d-11ef-b872-4f4337ee24f0 \
    REDIS_PASSWORD=admin

# The API is not very resilient to sudden mariadb restarts which can happen when the api and mariadb are starting
# at the same time. So we have a small entrypoint which waits for mariadb to be fully ready.
COPY wait-for-mariadb.sh /lagoon/entrypoints/99-wait-for-mariadb.sh

RUN corepack enable && pnpm build

# Backwards-compatibility symlink: some external services still reference
# /app/services/api/... paths. This makes them resolve to /app/...
RUN mkdir -p /app/services && ln -s /app /app/services/api

CMD ["node", "-r", "dotenv-extended/config", "dist/index"]
