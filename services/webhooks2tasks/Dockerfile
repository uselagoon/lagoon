FROM amazeeio/centos7-node-builder:6 as node-packages

# A bit an ugly hack to get files from the root directory of lagoon: Checking out the
# Git repo again with the same SHA as we are currently building so we can copy it
# This is necessary as with the current docker context we can't reach files from top level directories.

# if GIT_SHA is not set (like we are locally, we fall back to the develop branch)
ARG AMAZEEIO_GIT_SHA=origin/develop
RUN git init . && \
    git config remote.origin.url https://d3b4ce2e61fc43cbc6eaa96dfe72a92c480c813d@github.com/amazeeio/lagoon.git && \
    git fetch https://d3b4ce2e61fc43cbc6eaa96dfe72a92c480c813d@github.com/amazeeio/lagoon.git +refs/heads/*:refs/remotes/origin/* && \
    git checkout --force ${AMAZEEIO_GIT_SHA}

FROM amazeeio/centos7-node-builder:6 as builder
ENV NODE_ENV production
COPY package.json yarn.lock /app/services/webhooks2tasks/
COPY --from=node-packages /app/node-packages /app/node-packages
RUN cd /app/services/webhooks2tasks && BUILD_ONLY=true yarn install --pure-lockfile

FROM amazeeio/centos7-node:6
ENV NODE_ENV production
COPY --from=builder /app/services/webhooks2tasks/node_modules /app/services/webhooks2tasks/node_modules
COPY . /app/services/webhooks2tasks/

WORKDIR /app/services/webhooks2tasks

ARG AMAZEEIO_GIT_BRANCH=undefined
ENV RABBITMQ_HOST "${AMAZEEIO_GIT_BRANCH}-rabbitmq"

ENV AMAZEEIO_API_HOST "http://${AMAZEEIO_GIT_BRANCH}-api:3000"

RUN yarn run build

RUN fix-permissions /app/

CMD ["yarn", "start"]
