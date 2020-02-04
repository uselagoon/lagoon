# php-cli Image

Lagoon `php-cli` Docker image, based on Lagoon `php-fpm` image, with all needed tools for daily operations.

Containers (or pods) started from `cli` images are responsible for building code for **Composer** or **Node** based projects.
The image also owns database clis for both **MariaDB** and **PostgreSQL**.

This Dockerfile is intended to be used as an base for any cli needs within Lagoon.

## Lagoon & OpenShift adaptions

This image is prepared to be used on Lagoon which leverages OpenShift. There are therefore some things already done:

- Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/sclorg/s2i-base-container/blob/master/core/root/usr/bin/fix-permissions) so this image will work with a random user and therefore also on OpenShift.
- `COMPOSER_ALLOW_SUPERUSER=1` removes warning about use of composer as root
- `80-shell-timeout.sh` script checks if containers are running in a Kubernetes environment and then set a 10 minutes timeout to idle `cli` pods
- cli containers use ssh key injected by Lagoon or defined into `SSH_PRIVATE_KEY` environment variable

## Included cli tools

The included cli tools are:

- `composer` version 1.9.0 (changeable via `COMPOSER_VERSION` and `COMPOSER_HASH_SHA256`)
- `nodejs` verison v12 (as at October 2019)
- `npm`
- `yarn`
- `mariadb-client`
- `postgresql-client`


### Change NodeJS Version

By default this Image ships with the current Nodejs Version (v12 at time of writing this).

If you need another Version you can remove the current version and install the one of your choice.

## Environment variables

Environment variables allow some configuration to be customised in a repeatable way.

| Name                       | Default | Description                                           |
|----------------------------|---------|-------------------------------------------------------|
| MARIADB_MAX_ALLOWED_PACKET | 64M     | Controls the max allowed packet for the mysql client. |

### Changing an environment variable

Environment variables can be changed in the docker-compose file.

```
x-environment:
  &default-environment
    MARIADB_MAX_ALLOWED_PACKET: 128M

service:
  cli:
    environment:
    << : *default-environment
```