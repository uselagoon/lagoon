ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-uselagoon}/node-22-builder:${UPSTREAM_TAG:-latest}

COPY package.json yarn.lock .env.defaults tsconfig.json /app/
COPY node-packages /app/node-packages

# We need to copy all services, so we have all
# package.json files for workspaces, otherwise
# subdependencies won't be installed
COPY services/api/package.json /app/services/api/
COPY services/auth-server/package.json /app/services/auth-server/

RUN yarn install --frozen-lockfile --network-timeout 600000

RUN cd /app/node-packages/commons && yarn build
