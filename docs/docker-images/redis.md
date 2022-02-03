# Redis

[Lagoon `Redis` image Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/redis), based on [offical `redis:alpine` image](https://hub.docker.com/_/redis/).

This Dockerfile is intended to be used to set up a standalone Redis _ephemeral_ server by default.

## Supported versions

* 5 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/redis/5.Dockerfile) - `uselagoon/redis-5` or `uselagoon/redis-5-persistent`
* 6 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/redis/6.Dockerfile) - `uselagoon/redis-6` or `uselagoon/redis-6-persistent`

## Usage

There are 2 different flavors of Redis Images. **Ephemeral** and **Persistent**.

### Ephemeral

The ephemeral image is intended to be used as an in-memory cache for applications and will not retain data across container restarts.
If used as in-memory cache the first thing you might want to tune if you are having big caches is to adapt the `MAXMEMORY` variable to bump the allowed memory usage to a value your application is working well.
If used as in-memory cache the first thing you might want to tune if you are having big caches is to adapt the `MAXMEMORY` variable to bump the allowed memory usage to a value your application is working well.

### Persistent

The persistent Redis image will persist data across container restarts and can be used for queues or application data that will need persistence.
We don't suggest to use the persistent image for in-memory cache scenarios as this might have side-effects on your application while a Redis container is restarting or persisting data to disk.

## Lagoon adaptions

This image is prepared to be used on Lagoon. There are therefore some things already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions)so this image will work with a random user.
* The files within `/etc/redis/*` are parsed through [`envplate`](https://github.com/kreuzwerker/envplate)with a container-entrypoint.

## Included `redis.conf` configuration file

The image ships a _default_ Redis configuration file, optimized to work on Lagoon. Some options are configurable via environments variables \(see [Environment Variables](../using-lagoon-advanced/environment-variables.md)\).

## Environment Variables

Environment variables defined in Redis base image. See also [https://raw.githubusercontent.com/antirez/redis/4.0/redis.conf](https://raw.githubusercontent.com/antirez/redis/4.0/redis.conf) for further config.

| Environment Variable | Default  |                                        Description                                        |
| :------------------- | :------- | :---------------------------------------------------------------------------------------- |
| `DATABASES`          | -1       | Default number of databases created at startup                                            |
| `LOGLEVEL`           | notice   | Define the level of logs                                                                  |
| `MAXMEMORY`          | 100mb    | Maximum amount of memory                                                                  |
| `REDIS_PASSWORD`     | disabled | Enables [authentication feature](https://redis.io/topics/security#authentication-feature) |

## Redis-persistent

The [Lagoon `redis-persistent` Docker image](https://github.com/uselagoon/lagoon-images/blob/main/images/redis-persistent/5.Dockerfile). Based on the [Lagoon `redis` image](./), it is intended for use if the Redis service must be in `persistent` mode \(ie. with a persistent volume where transactions will be saved\).

It differs from `redis` only for `FLAVOR` environment variable which will use the [respective Redis configurations](https://github.com/uselagoon/lagoon-images/tree/main/images/redis/conf).
