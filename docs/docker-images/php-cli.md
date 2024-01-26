# PHP-CLI

The [Lagoon `php-cli` Docker image](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli). Based on [Lagoon `php-fpm` image](./php-fpm.md), it has all the needed command line tools for daily operations.

Containers \(or pods\) started from `cli` images are responsible for building code for Composer or Node.js based projects.

The image also contains database `cli`s for both MariaDB and PostgreSQL.

!!! Info
    This Dockerfile is intended to be used as a base for any `cli` needs within Lagoon.

## Supported versions

* 7.3 \(available for compatibility only, no longer officially supported\)
* 7.4 \(available for compatibility only, no longer officially supported\)
* 8.0 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli/8.0.Dockerfile) (Security Support until November 2023) - `uselagoon/php-8.0-cli`
* 8.1 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli/8.1.Dockerfile) (Security Support until November 2024) - `uselagoon/php-8.1-cli`
* 8.2 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli/8.2.Dockerfile) (Security Support until December 2025) - `uselagoon/php-8.2-cli`

All PHP versions use their own Dockerfiles.

## Lagoon adaptions

This image is prepared to be used on Lagoon. There are therefore some things already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions), so this image will work with a random user.
* `COMPOSER_ALLOW_SUPERUSER=1` removes warning about use of Composer as root.
* `80-shell-timeout.sh` script checks if containers are running in a Kubernetes environment and then set a 10 minutes timeout to idle `cli` pods.
* `cli` containers use an SSH key injected by Lagoon or defined into `SSH_PRIVATE_KEY`environment variable.

## Included CLI tools

The included CLI tools are:

* [`composer` version 1.9.0](https://getcomposer.org/) \(changeable via `COMPOSER_VERSION` and `COMPOSER_HASH_SHA256`\)
* [`node.js` verison 17](https://nodejs.org/en/) \(as of Mar 2022\)
* [`npm`](https://www.npmjs.com/)
* [`yarn`](https://yarnpkg.com/lang/en/)
* `mariadb-client`
* `postgresql-client`

### Change Node.js Version

By default this image ships with the `nodejs-current` package \(v17 as of Mar 2022\). If you need another version you can remove the current version and install the one of your choice. For example, to install Node.js 16, modify your dockerfile to include:

```bash title="Update Node.js version"
RUN apk del nodejs-current \
    && apk add --no-cache nodejs=~16
```

## Environment variables

Some options are configurable via [environment
variables](../using-lagoon-advanced/environment-variables.md). The [php-fpm
environment variables](php-fpm.md#environment-variables) also apply.

| Name                       | Default | Description                                           |
| :------------------------- | :------ | :---------------------------------------------------- |
| MARIADB_MAX_ALLOWED_PACKET | 64M     | Controls the max allowed packet for the MySql client. |
