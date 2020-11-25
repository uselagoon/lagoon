# PHP-CLI

The [Lagoon `php-cli` Docker image](https://github.com/amazeeio/lagoon/blob/master/images/php/cli/Dockerfile). Based on [Lagoon `php-fpm` image](../php-fpm.md), it has all the needed command line tools for daily operations.

Containers \(or pods\) started from `cli` images are responsible for building code for Composer or Node.js based projects.

The image also contains database `cli`s for both MariaDB and PostgreSQL.

{% hint style="info" %}
This Dockerfile is intended to be used as a base for any `cli` needs within Lagoon.
{% endhint %}

## Lagoon adaptions

This image is prepared to be used on Lagoon. There are therefore some things already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/sclorg/s2i-base-container/blob/master/core/root/usr/bin/fix-permissions), so this image will work with a random user.
* `COMPOSER_ALLOW_SUPERUSER=1` removes warning about use of Composer as root.
* `80-shell-timeout.sh` script checks if containers are running in a Kubernetes environment and then set a 10 minutes timeout to idle `cli` pods.
* `cli` containers use an SSH key injected by Lagoon or defined into `SSH_PRIVATE_KEY`environment variable.

## Included cli tools

The included cli tools are:

* [`composer` version 1.9.0](https://getcomposer.org/) \(changeable via `COMPOSER_VERSION` and `COMPOSER_HASH_SHA256`\)
* [`node.js` verison 12](https://nodejs.org/en/) \(as of Jan 2020\)
* [`npm`](https://www.npmjs.com/)
* [`yarn`](https://yarnpkg.com/lang/en/)
* `mariadb-client`
* `postgresql-client`

### Change Node.js Version

By default this image ships with the current Node.js Version \(v12 as of Jan 2020\). If you need another version you can remove the current version and install the one of your choice.

## Environment variables

Environment variables allow some configuration to be customised in a repeatable way.

| Name | Default | Description |
| :--- | :--- | :--- |
| `MARIADB_MAX_ALLOWED_PACKET` | 64M | Controls the max allowed packet for the MySql client. |

### Changing an environment variable

Environment variables can be changed in the `docker-compose.yml` file.

```text
x-environment:
  &default-environment
    MARIADB_MAX_ALLOWED_PACKET: 128M

service:
  cli:
    environment:
    << : *default-environment
```

