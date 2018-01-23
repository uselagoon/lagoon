ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons
FROM docker:stable-dind

MAINTAINER amazee.io
ENV LAGOON=docker-host

# Copying commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /home /home

# When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
# When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
ENV TMPDIR=/tmp TMP=/tmp HOME=/home ENV=/home/.bashrc BASH_ENV=/home/.bashrc

RUN apk add --no-cache bash

ENV DOCKER_HOST=docker-host \
    OPENSHIFT_REGISTRY=docker-registry.default.svc:5000 \
    REPOSITORY_TO_UPDATE=amazeeio

RUN fix-permissions /home

COPY update-push-images.sh /update-push-images.sh
COPY prune-images.sh /prune-images.sh

ENTRYPOINT ["/lagoon/entrypoints.sh"]

CMD ["sh", "-c", "sh /usr/local/bin/dind /usr/local/bin/dockerd --host=tcp://0.0.0.0:2375 --host=unix:///var/run/docker.sock --insecure-registry=${OPENSHIFT_REGISTRY} --storage-driver=overlay2 --storage-opt=overlay2.override_kernel_check=1"]