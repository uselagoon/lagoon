FROM amazeeio/centos7-node-builder:6 as builder
COPY package.json yarn.lock /app/
RUN yarn install

FROM amazeeio/centos7-node:6
COPY --from=builder /app/node_modules /app/node_modules
COPY . /app/

EXPOSE 3000

CMD ["/usr/bin/yarn", "start"]
