# Redis

[Lagoon `Redis` image Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/redis), based on [offical `redis:alpine` image](https://hub.docker.com/\_/redis/).

This Dockerfile is intended to be used to set up a standalone Redis _ephemeral_ server by default.

## Supported versions

* 5 [\[Dockerfile\]](https://github.com/uselagoon/lagoon-images/blob/main/images/redis/5.Dockerfile)
* 6 [\[Dockerfile\]](https://github.com/uselagoon/lagoon-images/blob/main/images/redis/6.Dockerfile)

## Lagoon adaptions

This image is prepared to be used on Lagoon. There are therefore some things already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/sclorg/s2i-base-container/blob/master/core/root/usr/bin/fix-permissions)so this image will work with a random user.
* The files within `/etc/redis/*` are parsed through [`envplate`](https://github.com/kreuzwerker/envplate)with a container-entrypoint.

## Included `redis.conf` configuration file

The image ships a _default_ Redis configuration file, optimized to work on Lagoon. Some options are configurable via environments variables (see [Environment Variables](../../using-lagoon-advanced/environment-variables.md)).

## Environment Variables

Environment variables defined in Redis base image. See also [https://raw.githubusercontent.com/antirez/redis/4.0/redis.conf](https://raw.githubusercontent.com/antirez/redis/4.0/redis.conf) for further config.

| Environment Variable | Default  | Description                                                                               |
| -------------------- | -------- | ----------------------------------------------------------------------------------------- |
| `DATABASES`          | -1       | Default number of databases created at startup                                            |
| `LOGLEVEL`           | notice   | Define the level of logs                                                                  |
| `MAXMEMORY`          | 100mb    | Maximum amount of memory                                                                  |
| `REDIS_PASSWORD`     | disabled | Enables [authentication feature](https://redis.io/topics/security#authentication-feature) |
