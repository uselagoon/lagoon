ARG LAGOON_GIT_BRANCH
ARG UPSTREAM_REPO
ARG UPSTREAM_TAG

# STAGE 1: Install yarn workspace dependencies and build shared node packages
FROM ${UPSTREAM_REPO:-uselagoon}/node-22-builder:${UPSTREAM_TAG:-latest} AS workspace-builder

COPY package.json yarn.lock .env.defaults /app/
COPY services/api/package.json /app/services/api/

RUN yarn install --frozen-lockfile --network-timeout 600000

# STAGE 2: API service image
FROM ${UPSTREAM_REPO:-uselagoon}/node-22:${UPSTREAM_TAG:-latest}

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

# Copy the built workspace from stage 1
COPY --from=workspace-builder /app /app

# Setting the workdir to the service, all following commands will run from here
WORKDIR /app/services/api/

# Copying the .env.defaults into the Workdir
COPY --from=workspace-builder /app/.env.defaults .

# Copying files from our service
COPY services/api/ .

# Verify that all dependencies have been installed
RUN yarn check --verify-tree

# Making sure we run in production
ENV NODE_ENV=production \
    LOGSDB_ADMIN_PASSWORD=admin \
    ELASTICSEARCH_URL=http://logs-db-service:9200 \
    KEYCLOAK_API_CLIENT_SECRET=39d5282d-3684-4026-b4ed-04bbc034b61a \
    KEYCLOAK_ADMIN_API_CLIENT_SECRET=bb86d344-a52d-11ef-b872-4f4337ee24f0 \
    REDIS_PASSWORD=admin

# The API is not very resilient to sudden mariadb restarts which can happen when the api and mariadb are starting
# at the same time. So we have a small entrypoint which waits for mariadb to be fully ready.
COPY services/api/wait-for-mariadb.sh /lagoon/entrypoints/99-wait-for-mariadb.sh

RUN yarn build

CMD ["node", "-r", "dotenv-extended/config", "dist/index"]
