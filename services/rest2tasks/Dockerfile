FROM amazeeio/centos7-node-builder:6 as builder
ENV NODE_ENV production
COPY services/rest2tasks/package.json services/rest2tasks/yarn.lock /app/services/rest2tasks/
COPY node-packages /app/node-packages
RUN cd /app/services/rest2tasks && BUILD_ONLY=true yarn install --pure-lockfile

FROM amazeeio/centos7-node:6
ENV NODE_ENV production
COPY --from=builder /app/services/rest2tasks/node_modules /app/services/rest2tasks/node_modules
COPY services/rest2tasks /app/services/rest2tasks

WORKDIR /app/services/rest2tasks/

RUN yarn run build

RUN fix-permissions /app/

CMD ["yarn", "start"]

EXPOSE 3000