ARG UPSTREAM_REPO
ARG UPSTREAM_TAG

FROM ${UPSTREAM_REPO:-testlagoon}/node-10:${UPSTREAM_TAG:-latest}
COPY . /app/

RUN npm install

EXPOSE 3000

CMD ["node", "index.js"]
