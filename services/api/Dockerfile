FROM amazeeio/centos7-node-builder:8 as builder

# Use changes to package.json and yarn.lock to see if Docker should use cached nodejs deps.
COPY services/api/package.json services/api/yarn.lock /app/

# Run yarn install and remove the .yarn-cache as we don't need that on our image.
RUN BUILD_ONLY=true yarn install --pure-lockfile

FROM amazeeio/centos7-node:8
COPY --from=builder /app/node_modules /app/node_modules

# Now copy in our application code.
COPY services/api /app

# Fixing permissions of the app folder so that the openshift user can access it with write.
RUN fix-permissions /app && \
    fix-permissions /home

RUN yarn run build

CMD yarn run start
