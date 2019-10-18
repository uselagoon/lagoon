# php-cli Image

Based on Lagoon php-fpm image, `cli` image has all needed tools for daily operations.
Containers (or PODS) started from `cli` images are responsible for building code for `composer` or `node` based projects.
The image also owns database CLIs for both **MariaDB** and **PostgreSQL**.

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
- `nodejs` verison v9 (to change nodejs version check )
- `npm`
- `yarn`
- `mariadb-client`
- `postgresql-client`


### Change NodeJS Version

By default this Image ships with the current Nodejs Version (v9 at time of writing this). If you need another Version you can remove the current version and install the one of your choice.

Add these commands as parts of your customized Dockerfile within RUN commands.

#### Remove current version (needed for installing any other Version)

    RUN apk del --no-cache nodejs-current yarn --repository http://dl-cdn.alpinelinux.org/alpine/edge/main/ --repository http://dl-cdn.alpinelinux.org/alpine/edge/community/

#### Install Nodejs Version 6

    RUN apk add --no-cache nodejs yarn --repository http://dl-cdn.alpinelinux.org/alpine/edge/community/

#### Install Nodejs Version 8

    RUN apk add --no-cache nodejs yarn --repository http://dl-cdn.alpinelinux.org/alpine/edge/community/ --repository http://dl-cdn.alpinelinux.org/alpine/edge/main/


## Environment Variables

Environment variables are meant to do common behavior changes of php.

| Environment Variable              | Default   | Description                                                                                                                                                                                                              |
| --------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `COMPOSER_VERSION`                | `1.9.0`   | Default installed composer version                                                                                                                                            |
| `COMPOSER_HASH_SHA256`            | `c9dff69d092bdec14dee64df6677e7430163509798895fbd54891c166c5c0875` | SHA256 fingerprint of composer file
| `COMPOSER_ALLOW_SUPERUSER`        | `1`       | Remove warning about running as root in composer