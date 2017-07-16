FROM amazeeio/centos7-node-builder:6 as builder
ENV NODE_ENV production
COPY services/webhooks2tasks/package.json services/webhooks2tasks/yarn.lock /app/services/webhooks2tasks/
COPY node-packages /app/node-packages
RUN cd /app/services/webhooks2tasks && BUILD_ONLY=true yarn install --pure-lockfile

FROM amazeeio/centos7-node:6
ENV NODE_ENV production
COPY --from=builder /app/services/webhooks2tasks/node_modules /app/services/webhooks2tasks/node_modules
COPY services/webhooks2tasks /app/services/webhooks2tasks

WORKDIR /app/services/webhooks2tasks

RUN yarn run build

RUN fix-permissions /app/

CMD ["yarn", "start"]
