ARG AMAZEEIO_GIT_BRANCH
ARG IMAGE_REPO
FROM ${IMAGE_REPO:-amazeeiolagoon}/centos7-node8:${AMAZEEIO_GIT_BRANCH:-latest}
ENV NODE_ENV production
COPY package.json yarn.lock /app/
RUN BUILD_ONLY=true yarn install --pure-lockfile && yarn cache clean

COPY . /app

RUN yarn run build

CMD ["yarn", "start"]

EXPOSE 3000
