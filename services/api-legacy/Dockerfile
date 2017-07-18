FROM amazeeio/centos7-node-builder:6 as builder
COPY services/api-legacy/package.json services/api-legacy/yarn.lock /app/
RUN BUILD_ONLY=true yarn install --pure-lockfile && yarn cache clean

FROM amazeeio/centos7-node:6
ENV NODE_ENV production
COPY --from=builder /app/node_modules /app/node_modules
COPY services/api-legacy /app

RUN yarn run build

RUN fix-permissions /app/

CMD ["yarn", "start"]
