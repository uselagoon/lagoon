ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/centos7-node8-builder
ENV NODE_ENV production
COPY package.json yarn.lock .env.defaults /app/
COPY node-packages /app/node-packages
RUN BUILD_ONLY=true yarn install --pure-lockfile