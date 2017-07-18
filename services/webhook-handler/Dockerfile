FROM amazeeio/centos7-node-builder:6 as builder
ENV NODE_ENV production
COPY services/webhook-handler/package.json services/webhook-handler/yarn.lock /app/services/webhook-handler/
COPY node-packages /app/node-packages
RUN cd /app/services/webhook-handler && BUILD_ONLY=true yarn install --pure-lockfile

FROM amazeeio/centos7-node:6
ENV NODE_ENV production
COPY --from=builder /app/services/webhook-handler/node_modules /app/services/webhook-handler/node_modules
COPY services/webhook-handler /app/services/webhook-handler

WORKDIR /app/services/webhook-handler/

RUN yarn run build

RUN fix-permissions /app/

CMD ["yarn", "start"]

EXPOSE 3000