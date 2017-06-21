FROM amazeeio/centos7-node-builder:6 as builder
ENV NODE_ENV production
COPY package.json yarn.lock /app/
RUN BUILD_ONLY=true yarn install --pure-lockfile && yarn cache clean

FROM amazeeio/centos7-node:6
ENV NODE_ENV production
COPY --from=builder /app/node_modules /app/node_modules
COPY . /app/

ARG AMAZEEIO_GIT_BRANCH=undefined
ENV RABBITMQ_HOST "amazeeio:NYTVU4jdRMjRMmbRcC3JubDH8M34MrWeT3@${AMAZEEIO_GIT_BRANCH}-rabbitmq"

ENV AMAZEEIO_API_HOST "http://${AMAZEEIO_GIT_BRANCH}-api:8080"

RUN yarn run build

RUN fix-permissions /app/

CMD ["yarn", "start"]

EXPOSE 3000