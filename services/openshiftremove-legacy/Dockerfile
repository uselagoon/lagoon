FROM amazeeio/centos7-node-builder:6 as builder
ENV NODE_ENV production
COPY services/openshiftremove-legacy/package.json services/openshiftremove-legacy/yarn.lock /app/services/openshiftremove-legacy/
COPY node-packages /app/node-packages
RUN cd /app/services/openshiftremove-legacy && BUILD_ONLY=true yarn install --pure-lockfile

FROM amazeeio/centos7-node:6
ENV NODE_ENV production
COPY --from=builder /app/services/openshiftremove-legacy/node_modules /app/services/openshiftremove-legacy/node_modules
COPY services/openshiftremove-legacy /app/services/openshiftremove-legacy

WORKDIR /app/services/openshiftremove-legacy/

RUN yarn run build

RUN fix-permissions /app/

CMD ["yarn", "start"]
