ARG AMAZEEIO_GIT_BRANCH
ARG IMAGE_REPO
FROM ${IMAGE_REPO:-amazeeiolagoon}/centos7-node8-builder:${AMAZEEIO_GIT_BRANCH:-latest} as builder

# Use changes to package.json and yarn.lock to see if Docker should use cached nodejs deps.
COPY package.json yarn.lock /app/

# Run yarn install and remove the .yarn-cache as we don't need that on our image.
RUN BUILD_ONLY=true yarn install --pure-lockfile

FROM ${IMAGE_REPO:-amazeeiolagoon}/centos7-node8:${AMAZEEIO_GIT_BRANCH:-latest}
COPY --from=builder /app/node_modules /app/node_modules

# Now copy in our application code.
COPY . /app

RUN yarn run build

CMD yarn run start