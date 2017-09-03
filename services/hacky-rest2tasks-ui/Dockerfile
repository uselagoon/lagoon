ARG IMAGEREPO
FROM amazeeiolagoon/centos7-node-builder:6 as builder
ENV NODE_ENV production
COPY services/hacky-rest2tasks-ui/package.json services/hacky-rest2tasks-ui/yarn.lock /app/
RUN BUILD_ONLY=true yarn install --pure-lockfile && yarn cache clean

FROM amazeeiolagoon/centos7-node:6
ENV NODE_ENV production
COPY --from=builder /app/node_modules /app/node_modules
COPY services/hacky-rest2tasks-ui /app

RUN yarn run build

RUN fix-permissions /app/

CMD ["yarn", "start"]

EXPOSE 3000
