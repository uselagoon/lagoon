ARG LAGOON_GIT_BRANCH
ARG IMAGE_REPO
ARG UPSTREAM_REPO
ARG UPSTREAM_TAG

FROM ${UPSTREAM_REPO:-uselagoon}/node-16-builder:${UPSTREAM_TAG:-latest}

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

# Setting the workdir to the service, all following commands will run from here
WORKDIR /app/services/uiv2/

# Copying files from our service
COPY . .

RUN yarn install

RUN yarn check --verify-tree

# Making sure we run in production
ENV NODE_ENV=production

RUN yarn run build

CMD ["yarn", "start"]
