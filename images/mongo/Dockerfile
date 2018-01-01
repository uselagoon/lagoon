ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons
FROM ${IMAGE_REPO:-lagoon}/centos7

MAINTAINER amazee.io

# Copying commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /home/.bashrc /home/.bashrc

RUN chmod g+w /etc/passwd \
    && mkdir -p /home

# When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
# When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
ENV TMPDIR=/tmp TMP=/tmp HOME=/home ENV=/home/.bashrc BASH_ENV=/home/.bashrc

COPY yum.mongodb-org-3.4.repo /etc/yum.repos.d/mongodb-org-3.4.repo

RUN yum install -y mongodb-org && \
    yum clean all

RUN mv /etc/mongod.conf /etc/mongod.conf.orig && \
    mkdir -p /data/db /data/configdb && \
    fix-permissions /data/db && \
    fix-permissions /data/configdb

COPY docker-entrypoint /lagoon/entrypoints/70-mongo-entrypoint

CMD ["mongod"]

ENTRYPOINT ["/lagoon/entrypoints.sh"]
