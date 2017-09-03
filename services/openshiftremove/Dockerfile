# STAGE 1: Loading Image lagoon-node-packages-builder which contains node packages shared by all Node Services
ARG IMAGEREPO
FROM amazeeiolagoon/lagoon-node-packages-builder:latest as lagoon-packages-builder

# STAGE 2: specific service node package build
ARG IMAGEREPO
FROM amazeeiolagoon/centos7-node-builder:8 as builder
ENV NODE_ENV production
# Copying generated node_modules from the first stage
COPY --from=lagoon-packages-builder /app /app
COPY package.json /app/services/openshiftremove/
# yarn install, our service might need special packages
RUN cd /app/services/openshiftremove && yarn install --pure-lockfile

# STAGE 3: runtime image with actual code
ARG IMAGEREPO
FROM amazeeiolagoon/centos7-node:8
COPY --from=builder /app /app
# Copying files from our service
COPY . /app/services/openshiftremove
WORKDIR /app/services/openshiftremove/

# Copying the .env.defaults into the Workdir, as the dotenv system searches within the workdir for it
COPY --from=lagoon-packages-builder /app/.env.defaults .

# building our service
RUN yarn run build

CMD ["yarn", "start"]
