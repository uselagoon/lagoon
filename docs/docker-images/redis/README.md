# Redis

[Lagoon `Redis` image Dockerfile](https://github.com/amazeeio/lagoon/blob/master/images/redis/Dockerfile), based on [offical `redis:alpine` image](https://hub.docker.com/_/redis/).

This Dockerfile is intended to be used to setup a standalone Redis _ephemeral_ server by default.

## Version

Currently supports alpine version 5.x.

## Lagoon & OpenShift adaptions

This image is prepared to be used on Lagoon which leverages OpenShift. There are therefore some things already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/sclorg/s2i-base-container/blob/master/core/root/usr/bin/fix-permissions)so this image will work with a random user, and therefore also on OpenShift.
* The files within `/etc/redis/*` are parsed through [`envplate`](https://github.com/kreuzwerker/envplate)with a container-entrypoint.

## Included `redis.conf` configuration file

The image ships a _default_ Redis configuration file, optimized to work on Lagoon. Some options are configurable via environments variables \(see [Environment Variables](../../using-lagoon/environment-variables.md)\).

## Environment Variables

Environment variables defined in Redis base image. See also [https://raw.githubusercontent.com/antirez/redis/4.0/redis.conf](https://raw.githubusercontent.com/antirez/redis/4.0/redis.conf) for further config.

| Environment Variable | Default | Description |
| :--- | :--- | :--- |
| `LOGLEVEL` | notice | Define the level of logs |
| `DATABASES` | -1 | Default number of databases created at startup |
| `MAXMEMORY` | 100mb | Maximum amount of memory |

