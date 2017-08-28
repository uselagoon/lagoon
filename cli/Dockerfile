FROM amazeeio/centos7-node-builder:8 as builder

# Use changes to package.json and yarn.lock to see if Docker should use cached nodejs deps.
COPY package.json yarn.lock /app/

# Run yarn install and remove the .yarn-cache as we don't need that on our image.
RUN BUILD_ONLY=true yarn install --pure-lockfile

FROM amazeeio/centos7-node:8

RUN yum install -y openssh-clients && yum clean all -y
COPY container-entrypoint.sh /amazeeio/entrypoints/80-ssh-key.sh

COPY --from=builder /app/node_modules /app/node_modules

# Now copy in our application code.
COPY . /app

CMD exec /bin/bash -c "trap : TERM INT; sleep infinity & wait"
