FROM amazeeio/centos7-node-builder:8

# Use changes to package.json and yarn.lock to see if Docker should use cached nodejs deps.
COPY package.json yarn.lock /app/

# Run yarn install and remove the .yarn-cache as we don't need that on our image.
RUN BUILD_ONLY=true yarn install --pure-lockfile && yarn cache clean

# Now copy in our application code.
COPY . /app

# Fixing permissions of the app folder so that the openshift user can access it with write.
RUN fix-permissions /app && \
    fix-permissions /home

ENTRYPOINT yarn run execute
