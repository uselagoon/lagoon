FROM amazeeio/centos7-node-builder:6 as builder
ENV NODE_ENV production
COPY services/openshiftdeploy-legacy/package.json services/openshiftdeploy-legacy/yarn.lock /app/services/openshiftdeploy-legacy/
COPY node-packages /app/node-packages
RUN cd /app/services/openshiftdeploy-legacy && BUILD_ONLY=true yarn install --pure-lockfile

FROM amazeeio/centos7-node:6
ENV NODE_ENV production
COPY --from=builder /app/services/openshiftdeploy-legacy/node_modules /app/services/openshiftdeploy-legacy/node_modules
COPY services/openshiftdeploy-legacy services/openshiftdeploy-legacy

WORKDIR /app/services/openshiftdeploy-legacy/

RUN yarn run build

RUN fix-permissions /app/

CMD ["yarn", "start"]
