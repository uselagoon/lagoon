ARG LAGOON_GIT_BRANCH
ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-uselagoon}/node-22:${UPSTREAM_TAG:-latest}

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

WORKDIR /app/

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000

# Copying files from our service
COPY . .

# Making sure we run in production
ENV NODE_ENV=production \
    KEYCLOAK_AUTH_SERVER_CLIENT_SECRET=f605b150-7636-4447-abd3-70988786b330

RUN yarn build

CMD ["yarn", "start"]
