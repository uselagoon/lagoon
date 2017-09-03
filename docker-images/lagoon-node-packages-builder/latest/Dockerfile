FROM amazeeiolagoon/centos7-node-builder:8
ENV NODE_ENV production
COPY package.json yarn.lock .yarnrc .env.defaults /app/
COPY node-packages /app/node-packages
RUN BUILD_ONLY=true yarn install --pure-lockfile