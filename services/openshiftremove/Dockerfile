ARG AMAZEEIO_GIT_BRANCH
ARG IMAGE_REPO
# STAGE 1: Loading Image lagoon-node-packages-builder which contains node packages shared by all Node Services
FROM ${IMAGE_REPO:-amazeeiolagoon}/yarn-workspace-builder:${AMAZEEIO_GIT_BRANCH:-latest} as yarn-workspace-builder

# STAGE 2: specific service Image
FROM ${IMAGE_REPO:-amazeeiolagoon}/centos7-node8:${AMAZEEIO_GIT_BRANCH:-latest}
ENV NODE_ENV production

# Copying generated node_modules from the first stage
COPY --from=yarn-workspace-builder /app /app

# Setting the workdir to the service, all following commands will run from here
WORKDIR /app/services/myself/

# Copying the .env.defaults into the Workdir, as the dotenv system searches within the workdir for it
COPY --from=yarn-workspace-builder /app/.env.defaults .

# Copying our own package.json
COPY package.json .

# yarn install, our service might need special packages
RUN yarn install --pure-lockfile && yarn cache clean

# Copying files from our service
COPY . .

# building our service
RUN yarn run build

CMD ["yarn", "start"]