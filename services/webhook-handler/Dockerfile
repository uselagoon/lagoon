ARG LAGOON_GIT_BRANCH
ARG IMAGE_REPO
ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
# STAGE 1: Loading Image lagoon-node-packages-builder which contains node packages shared by all Node Services
FROM ${IMAGE_REPO:-lagoon}/yarn-workspace-builder AS yarn-workspace-builder

# STAGE 2: specific service Image
FROM ${UPSTREAM_REPO:-uselagoon}/node-22:${UPSTREAM_TAG:-latest}

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

# Copying generated node_modules from the first stage
COPY --from=yarn-workspace-builder /app /app

# Setting the workdir to the service, all following commands will run from here
WORKDIR /app/services/webhook-handler/

# Copying the .env.defaults into the Workdir, as the dotenv system searches within the workdir for it
COPY --from=yarn-workspace-builder /app/.env.defaults .

# Copying files from our service
COPY . .

# Verify that all dependencies have been installed via the yarn-workspace-builder
RUN yarn check --verify-tree

# Making sure we run in production
ENV NODE_ENV production

RUN yarn build

CMD ["yarn", "start"]
