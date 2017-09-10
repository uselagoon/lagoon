ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/centos7-node6-builder as builder
COPY package.json yarn.lock /app/
RUN yarn install

FROM ${IMAGE_REPO:-lagoon}/centos7-node6
COPY --from=builder /app/node_modules /app/node_modules
COPY . /app/

ARG AMAZEEIO_GIT_SHA=0000000000000000000000000000000000000000
ENV AMAZEEIO_GIT_SHA_BUILDTIME ${AMAZEEIO_GIT_SHA}

ARG AMAZEEIO_GIT_BRANCH=undefined
ENV AMAZEEIO_GIT_BRANCH_BUILDTIME ${AMAZEEIO_GIT_BRANCH}

EXPOSE 3000

CMD ["/usr/bin/yarn", "start"]
