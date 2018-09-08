ARG IMAGE_REPO
FROM ${IMAGE_REPO:-amazeeio}/php:7.0-cli-drupal

# Load the SSH private key and source repository from docker build arguments
ARG LAGOON_SSH_PRIVATE_KEY
ARG LAGOON_GIT_SOURCE_REPOSITORY

# convert the ssh-key from the env SSH_PRIVATE_KEY into an actual ssh key in the filesystem (/home/.ssh/key)
RUN /lagoon/entrypoints/05-ssh-key.sh

# Test if we can access a remote git repo (it should use the key in /home/.ssh/key) and remove the key again if it worked
RUN git ls-remote $LAGOON_GIT_SOURCE_REPOSITORY && rm -rf /home/.ssh/key

COPY composer.json composer.lock /app/
COPY scripts /app/scripts
RUN composer install --no-dev
COPY . /app

ENV WEBROOT=web