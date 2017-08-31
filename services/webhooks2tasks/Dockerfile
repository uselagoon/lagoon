
# STAGE 1: building packages needed by all lagoon services
# Idea is that this build is the exact same for all services so we profit highly from layer caching
FROM amazeeio/centos7-node-builder:8 as lagoon-packages-builder
ENV NODE_ENV production
COPY package.json yarn.lock .yarnrc /app/
COPY node-packages /app/node-packages
RUN BUILD_ONLY=true yarn install --pure-lockfile

# STAGE 2: specific service node package build
FROM amazeeio/centos7-node-builder:8 as service-builder
ENV NODE_ENV production
# Copying generated node_modules from the first stage
COPY --from=lagoon-packages-builder /app /app
COPY services/webhooks2tasks/package.json /app/services/webhooks2tasks/
# yarn install, our service might need special packages
RUN cd /app/services/webhooks2tasks && yarn install --pure-lockfile

# STAGE 3: runtime image with actual code
FROM amazeeio/centos7-node:8
COPY --from=service-builder /app /app
# Copying files from our service
COPY services/webhooks2tasks /app/services/webhooks2tasks
WORKDIR /app/services/webhooks2tasks/

COPY .env.defaults .

# building our service
RUN yarn run build

CMD ["yarn", "start"]
