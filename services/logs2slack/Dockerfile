FROM amazeeio/centos7-node-builder:6 as builder
ENV NODE_ENV production
COPY services/logs2slack/package.json services/logs2slack/yarn.lock /app/services/logs2slack/
COPY node-packages /app/node-packages
RUN cd /app/services/logs2slack && BUILD_ONLY=true yarn install --pure-lockfile

FROM amazeeio/centos7-node:6
ENV NODE_ENV production
COPY --from=builder /app/services/logs2slack/node_modules /app/services/logs2slack/node_modules
COPY services/logs2slack /app/services/logs2slack

WORKDIR /app/services/logs2slack

RUN yarn run build

RUN fix-permissions /app/

CMD ["yarn", "start"]
