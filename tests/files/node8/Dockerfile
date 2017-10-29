ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/node:8-builder as builder
COPY package.json yarn.lock /app/
RUN yarn install

FROM ${IMAGE_REPO:-lagoon}/node:8
COPY --from=builder /app/node_modules /app/node_modules
COPY . /app/

ARG LAGOON_GIT_SHA=0000000000000000000000000000000000000000
ENV LAGOON_GIT_SHA_BUILDTIME ${LAGOON_GIT_SHA}

ARG LAGOON_GIT_BRANCH=undefined
ENV LAGOON_GIT_BRANCH_BUILDTIME ${LAGOON_GIT_BRANCH}

EXPOSE 3000

CMD ["yarn", "run", "start"]
