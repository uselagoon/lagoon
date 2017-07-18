FROM amazeeio/centos7-node-builder:6 as builder
ENV NODE_ENV production
COPY services/openShiftRemove/package.json services/openShiftRemove/yarn.lock /app/services/openshiftremove/
COPY node-packages /app/node-packages
RUN cd /app/services/openshiftremove && BUILD_ONLY=true yarn install --pure-lockfile

FROM amazeeio/centos7-node:6
ENV NODE_ENV production
COPY --from=builder /app/services/openshiftremove/node_modules /app/services/openshiftremove/node_modules
COPY services/openShiftRemove /app/services/openshiftremove

WORKDIR /app/services/openshiftremove/

RUN yarn run build

RUN fix-permissions /app/

CMD ["yarn", "start"]
