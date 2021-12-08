ARG LAGOON_CACHE_node=alpine
FROM ${LAGOON_CACHE_node} as cache_image
# this is done to ensure that there is a cache directory, even on an empty test
COPY ./testoutput.dummy /cache/testoutput.dummy

ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-testlagoon}/node-14-builder:${UPSTREAM_TAG:-latest} as builder
COPY package.json yarn.lock /app/
RUN yarn install

FROM ${UPSTREAM_REPO:-testlagoon}/node-14:${UPSTREAM_TAG:-latest}
COPY --from=builder /app/node_modules /app/node_modules
COPY . /app/

# copy everything from cache - should only have dummy data on first pass
COPY --from=cache_image /cache/* /files/

ARG LAGOON_GIT_SHA=0000000000000000000000000000000000000000
ENV LAGOON_GIT_SHA_BUILDTIME ${LAGOON_GIT_SHA}

ARG LAGOON_GIT_BRANCH=undefined
ENV LAGOON_GIT_BRANCH_BUILDTIME ${LAGOON_GIT_BRANCH}

ARG LAGOON_BUILD_TYPE=undefined
ENV LAGOON_BUILD_TYPE_BUILDTIME ${LAGOON_BUILD_TYPE}

ARG LAGOON_PR_HEAD_BRANCH=undefined
ENV LAGOON_PR_HEAD_BRANCH_BUILDTIME ${LAGOON_PR_HEAD_BRANCH}

ARG LAGOON_PR_HEAD_SHA=undefined
ENV LAGOON_PR_HEAD_SHA_BUILDTIME ${LAGOON_PR_HEAD_SHA}

ARG LAGOON_PR_BASE_BRANCH=undefined
ENV LAGOON_PR_BASE_BRANCH_BUILDTIME ${LAGOON_PR_BASE_BRANCH}

ARG LAGOON_PR_BASE_SHA=undefined
ENV LAGOON_PR_BASE_SHA_BUILDTIME ${LAGOON_PR_BASE_SHA}

ARG LAGOON_PR_TITLE=undefined
ENV LAGOON_PR_TITLE_BUILDTIME ${LAGOON_PR_TITLE}

RUN mkdir -p /cache && echo "REPLACED BY CACHE" > /cache/testoutput.txt

EXPOSE 3000

CMD ["node", "index.js"]
