#!/usr/bin/env bash

# previously mariadb-galera used a `subPath` volume mount, which caused the folder `data` from a PVC to be mounted into `/var/lib/mysql`
# somehow this system broke on some Kubernetes versions so we mount the PVC directly into `/var/lib/mysql`
# this script will move the files from within /var/lib/mysql/data to /var/lib/mysql But only if this never happened before.

if [ -z "$(ls -A /var/lib/mysql | grep -v data)" ]; then
  # /var/lib/mysql has only a `data` folder, is therefore not migrated yet
  if [ ! -z "$(ls -A /var/lib/mysql/data)" ]; then
    # /var/lib/mysql/data is not empty so we move all files from within /var/lib/mysql/data into /var/lib/mysql
    echo "mysql files found in old location /var/lib/mysql/data, moving them into /var/lib/mysql"
    mv /var/lib/mysql/data/* /var/lib/mysql
    # ignore errors for dot files (as a non existing hidden dot file cause an error that we don't need)
    mv /var/lib/mysql/data/{.[!.]}* /var/lib/mysql || true
  fi
fi