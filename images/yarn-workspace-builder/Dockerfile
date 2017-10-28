ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/node:8-builder

RUN apk add --no-cache \
        libexecinfo-dev \
        python

COPY package.json yarn.lock .env.defaults /app/
COPY node-packages /app/node-packages

# We need to copy all services, so we have all
# package.json files for workspaces, otherwise
# subdependencies won't be installed
COPY services /app/services
RUN yarn install --frozen-lockfile

# We remove the services afterwards to prevent
# unnecessary source code in all the other service images
RUN rm -rf /app/services