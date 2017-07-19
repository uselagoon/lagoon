FROM amazeeio/centos7-node-builder:6 as builder
ENV NODE_ENV production
COPY services/openshiftdeploy/package.json services/openshiftdeploy/yarn.lock /app/services/openshiftdeploy/
COPY node-packages /app/node-packages
RUN cd /app/services/openshiftdeploy && BUILD_ONLY=true yarn install --pure-lockfile

FROM amazeeio/centos7-node:6
ENV NODE_ENV production
COPY --from=builder /app/services/openshiftdeploy/node_modules /app/services/openshiftdeploy/node_modules
COPY services/openShiftDeploy /app/services/openshiftdeploy

WORKDIR /app/services/openshiftdeploy/

RUN yarn run build

RUN fix-permissions /app/

CMD ["yarn", "start"]
