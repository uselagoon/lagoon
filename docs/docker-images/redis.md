# Redis

[Lagoon `Redis` image Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/redis), based on [offical `redis:alpine` image](https://hub.docker.com/_/redis/).

This Dockerfile is intended to be used to set up a standalone Redis _ephemeral_ server by default.

## Supported versions

* 5 \(available for compatibility only, no longer officially supported\) - `uselagoon/redis-5` or `uselagoon/redis-5-persistent`
* 6 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/redis/6.Dockerfile) - `uselagoon/redis-6` or `uselagoon/redis-6-persistent`
* 7 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/redis/7.Dockerfile) - `uselagoon/redis-7` or `uselagoon/redis-7-persistent`

## Usage

There are 2 different flavors of Redis Images: **Ephemeral** and **Persistent**.

### Ephemeral

The ephemeral image is intended to be used as an in-memory cache for applications and will not retain data across container restarts.

When being used as an in-memory (RAM) cache, the first thing you might want to tune if you have large caches is to adapt the `MAXMEMORY` variable. This variable controls the maximum amount of memory (RAM) which redis will use to store cached items.

### Persistent

The persistent Redis image will persist data across container restarts and can be used for queues or application data that will need persistence.

We don't typically suggest using a persistent Redis for in-memory cache scenarios as this might have unintended side-effects on your application while a Redis container is restarting and loading data from disk.

## Lagoon adaptions

This image is prepared to be used on Lagoon. There are therefore some things already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions)so this image will work with a random user.
* The files within `/etc/redis/*` are templated using [`envplate`](https://github.com/kreuzwerker/envplate) via a container-entrypoint.

## Included `redis.conf` configuration file

The image ships a _default_ Redis configuration file, optimized to work on Lagoon.

### Environment Variables

Some options are configurable via [environment
variables](../concepts-advanced/environment-variables.md).

| Environment Variable | Default     |                                        Description                                         |
| :------------------- | :---------- | :----------------------------------------------------------------------------------------- |
| DATABASES            | -1          | Default number of databases created at startup.                                            |
| LOGLEVEL             | notice      | Define the level of logs.                                                                  |
| MAXMEMORY            | 100mb       | Maximum amount of memory.                                                                  |
| MAXMEMORYPOLICY      | allkeys-lru | The policy to use when evicting keys if Redis reaches its maximum memory usage.            |
| REDIS_PASSWORD       | disabled    | Enables [authentication feature](https://redis.io/topics/security#authentication-feature). |

## Custom configuration

By building on the base image you can include custom configuration.
See [https://raw.githubusercontent.com/antirez/redis/4.0/redis.conf](https://raw.githubusercontent.com/antirez/redis/4.0/redis.conf) for full documentation of the Redis configuration file.

## Redis-persistent

Based on the [Lagoon `redis` image](https://github.com/uselagoon/lagoon-images/blob/main/images/redis/5.Dockerfile), the [Lagoon `redis-persistent` Docker image](https://github.com/uselagoon/lagoon-images/blob/main/images/redis-persistent/5.Dockerfile) is intended for use when the Redis service must be utilized in `persistent` mode \(ie. with a persistent volume where keys will be saved to disk\).

It differs from `redis` only with the `FLAVOR` environment variable, which will use the [respective Redis configuration](https://github.com/uselagoon/lagoon-images/tree/main/images/redis/conf) according to the version of redis in use.

## Troubleshooting

The Lagoon Redis images all come pre-loaded with the `redis-cli` command, which allows for querying the Redis service for information and setting config values dynamically. To use this utility, you can simply SSH into your Redis pod by using the instructions [here] (../interacting/ssh.md) with `redis` as the `pod` value then run it from the terminal once you've connected.

### Maximum Memory Policy

By default, the Lagoon `redis` images are set to use the `allkeys-lru` policy. This policy will alow **ANY** keys stored in Redis to be evicted if/when the Redis service hits its `maxmemory` limit according to when the key was least recently used.

For typical installations, this is the ideal configuration, as Drupal may not set a `TTL` value for each key cached in Redis. If the `maxmemory-policy` is set to something like `volatile-lru` and Drupal doesn't provide these `TTL` tags, this would result in the Redis container filling up, being totally unable to evict **ANY** keys, and ceasing to accept new cache keys at all.

More information on Redis' maxmemory policies can be found in Redis' [official documentation](https://redis.io/docs/manual/eviction/#eviction-policies).

!!! danger "Proceed with Caution"
    Changing this setting can lead to Redis becoming completely full and cause outages as a result.

### Tuning Redis' `maxmemory` value

Finding the optimal amount of memory to give Redis can be quite the difficult task. Before attempting to tune your Redis cache's memory size, it is prudent to let it run normally for as long as practical, with at least a day of typical usage being the ideal minimum timeframe.

There are a few high level things you can look at when tuning these memory values:

* The first thing to check is the percentage of memory in use by Redis currently.
  * If this percentage is less than `50%`, you might consider lowering the `maxmemory` value by 25%.
  * If this percentage is between `50%` and `75%`, things are running just fine.
  * If this value is greater than `75%`, then it's worth looking at other variables to see if `maxmemory` needs to be increased.
* If you find that your Redis' memory usage percentage is high, the next thing to look at is the number of key evictions.
  * A large number of key evictions and a memory usage greater than `95%` is a fairly good indicator that your redis needs a higher `maxmemory` setting.
  * If the number of key evictions doesn't seem high and typical response times are reasonable, this is simply indicative of Redis doing its job and managing its allocated memory as expected.

### Example commands

The following commands can be used to view information about the Redis service:

* View all info about the Redis service: `redis-cli info`
* View service memory information: `redis-cli info memory`
* View service keyspace information: `redis-cli info keyspace`
* View service statistics: `redis-cli info stats`

It is also possible to set values for the Redis service dynamically without a restart of the Redis service. It is important to note that these dynamically set values will not persist if the pod is restarted (which can happen as a result of a deployment, maintenance, or even just being shuffled from one node to another).

* Set `maxmemory` config value dynamically to `500mb`: `config set maxmemory 500mb`
* Set `maxmemory-policy` config value dynamically to `volatile-lru`: `config set maxmemory-policy volatile-lru`
