# amazee.io centos7 mariadb

amazee.io CentOS 7 Dockerfile with mariadb installed, based on amazeeio/centos:7 Docker Image.

This Dockerfile is intended to be used as an base for any mariadb needs within amazee.io. It follows the awesome work already happening in the official [mariadb docker image](https://hub.docker.com/_/mariadb/) just with some adaptions for amazeeio and of course running on centos.

- MariaDB is installed via https://downloads.mariadb.org/mariadb/repositories
- It is shipped with a complete empty `/var/lib/mysql` (during installation mysql is actually started and therefore some things filled in `/var/lib/mysql`, but we remove it right afterwards for consistency)
- the docker-entrypoint file is also based on the [official mariadb one](https://github.com/docker-library/mariadb/blob/master/10.1/docker-entrypoint.sh) and can setup a new Server, Database, User when container is started the first time and `/var/lib/mysql` is empty

## amazee.io & OpenShift adaptions

This image is prepared to be used on amazee.io which leverages OpenShift. There are therefore some things already done:

- Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/sclorg/s2i-base-container/blob/master/bin/fix-permissions) so this image will work with a random user and therefore also on OpenShift.
- all files within `/etc/my.cnf.d/` are parsed through [envplate](https://github.com/kreuzwerker/envplate) with an container-endpoint.

## Included mariadb config

The included mariadb config contains sane values that will make the usage of maradbeasier. See `server.cnf` for all of it.

If you don't like any of these configs, you have two possibilities:
1. If they are changeable via environment variables, use them (prefeered version, see list of environment variables below).
2. Create your own `server.cnf` config and overwrite the provided one with your own configuration.

## Environment Variables

Environment variables are meant to do common behavior changes of nginx. If you need more then these it is best to replace the `nginx.conf` file all together.

| Environment Variable | Default | Description  | 
|--------|---------|---|
| `MARIADB_INNODB_BUFFER_POOL_SIZE` | `256M` | InnoDB buffer pool size in bytes. The primary value to adjust on a database server with entirely/primarily XtraDB/InnoDB tables, can be set up to 80% of the total memory in these environments. More at [mariadb.com](https://mariadb.com/kb/en/mariadb/xtradbinnodb-server-system-variables/#innodb_buffer_pool_size) |

