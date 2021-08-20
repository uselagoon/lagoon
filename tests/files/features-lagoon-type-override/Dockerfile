ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-testlagoon}/node-16-builder:${UPSTREAM_TAG:-latest} as builder
COPY package.json yarn.lock /app/
RUN yarn install

FROM ${UPSTREAM_REPO:-testlagoon}/node-16:${UPSTREAM_TAG:-latest}
COPY --from=builder /app/node_modules /app/node_modules
COPY . /app/

ARG LAGOON_GIT_SHA=0000000000000000000000000000000000000000
ENV LAGOON_GIT_SHA_BUILDTIME ${LAGOON_GIT_SHA}

ARG LAGOON_GIT_BRANCH=undefined
ENV LAGOON_GIT_BRANCH_BUILDTIME ${LAGOON_GIT_BRANCH}

EXPOSE 3000

CMD ["yarn", "run", "start"]
