ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/centos7-node8

RUN yum install -y openssh-clients && yum clean all -y

# Use changes to package.json and yarn.lock to see if Docker should use cached nodejs deps.
COPY package.json yarn.lock /app/

# Run yarn install and remove the .yarn-cache as we don't need that on our image.
RUN BUILD_ONLY=true yarn install --pure-lockfile

COPY container-entrypoint.sh /amazeeio/entrypoints/80-ssh-key.sh

# Now copy in our application code.
COPY . /app

CMD exec /bin/bash -c "trap : TERM INT; sleep infinity & wait"
