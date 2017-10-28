ARG AMAZEEIO_GIT_BRANCH
ARG IMAGE_REPO
# STAGE 1: Loading Image lagoon-node-packages-builder which contains node packages shared by all Node Services
FROM ${IMAGE_REPO:-amazeeiolagoon}/yarn-workspace-builder:${AMAZEEIO_GIT_BRANCH:-latest} as yarn-workspace-builder

# STAGE 2: specific service Image
FROM amazeeio/centos7-node8-builder

# Copying the common .env.defaults to the lagoon root for later usage
COPY --from=yarn-workspace-builder /app/.env.defaults .

# Setting the workdir to the service, all following commands will run from here
WORKDIR /app/services/api/

# Copying our own package.json
COPY package.json .

# yarn install, our service might need special packages
RUN yarn install && yarn cache clean

ENV NODE_ENV production

# Copying files from our service
COPY . .

# Append common env.defaults to the service's own .env.defaults
RUN bash -c 'cat /app/.env.defaults >> /app/services/api/.env.defaults'

# building our service
RUN yarn run build

CMD ["yarn", "start"]
