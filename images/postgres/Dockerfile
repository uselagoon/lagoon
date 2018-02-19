ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/commons as commons
FROM postgres:alpine

# Copying commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /home /home

# When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
# When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
ENV TMPDIR=/tmp TMP=/tmp HOME=/home ENV=/home/.bashrc BASH_ENV=/home/.bashrc

RUN chmod g+w /etc/passwd \
    && mkdir -p /home

ENV LAGOON=postgres

RUN cp /usr/local/bin/docker-entrypoint.sh /lagoon/entrypoints/90-postgres-entrypoint
COPY postgres-backup.sh /lagoon/

RUN echo -e "local all all md5\nhost  all  all 0.0.0.0/0 md5" >> /usr/local/share/postgresql/pg_hba.conf

ENV PGUSER=postgres \
    POSTGRES_PASSWORD=lagoon \
    POSTGRES_USER=lagoon \
    POSTGRES_DB=lagoon \
    PGDATA=/var/lib/postgresql/data/pgdata

# Postgresql entrypoint file needs bash, so start the entrypoints with bash
ENTRYPOINT ["/lagoon/entrypoints.bash"]
CMD ["postgres"]