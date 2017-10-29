ARG LAGOON_GIT_BRANCH
ARG IMAGE_REPO
# STAGE 1: Loading Image lagoon-node-packages-builder which contains node packages shared by all Node Services
FROM ${IMAGE_REPO:-amazeeiolagoon}/yarn-workspace-builder:${LAGOON_GIT_BRANCH:-latest} as yarn-workspace-builder

# STAGE 2: specific service Image
FROM ${IMAGE_REPO:-amazeeiolagoon}/node:8

# Copying generated node_modules from the first stage
COPY --from=yarn-workspace-builder /app /app

# Setting the workdir to the service, all following commands will run from here
WORKDIR /app/services/myself/

# Copying the .env.defaults into the Workdir, as the dotenv system searches within the workdir for it
COPY --from=yarn-workspace-builder /app/.env.defaults .

# Copying files from our service
COPY . .

# Link your service node_modules/.bin with the yarn workspace node_modules/.bin
RUN mkdir -p node_modules \
    && ln -s /app/node_modules/.bin node_modules/.bin

ENV NODE_ENV production

# building our service
RUN yarn run build

CMD ["yarn", "start"]