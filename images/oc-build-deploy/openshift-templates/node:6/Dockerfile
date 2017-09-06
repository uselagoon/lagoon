FROM amazeeio/centos7-node6-builder as builder
COPY package.json yarn.lock /app/
RUN yarn install

FROM amazeeio/centos7-node6
COPY --from=builder /app/node_modules /app/node_modules
COPY . /app/

EXPOSE 3000

CMD ["/usr/bin/yarn", "start"]
