# Valkey

[Lagoon `valkey` image Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/valkey), based on [official `valkey/valkey:alpine` image](https://hub.docker.com/r/valkey/valkey).

This Dockerfile is intended to be used to set up a standalone Valkey _ephemeral_ server by default.

!!! info
    Valkey is a [community-led successor to Redis](https://www.linuxfoundation.org/press/linux-foundation-launches-open-source-valkey-community) It's intended to be backwards compatible, but any integration should always be tested prior to first use.

## Supported versions

* 8 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/valkey/8.Dockerfile) - `uselagoon/valkey-8`

## Usage

There are 2 different flavors of Valkey: **Ephemeral** and **Persistent**.

### Ephemeral

The ephemeral flavor is intended to be used as an in-memory cache for applications and will not retain data across container restarts.

When being used as an in-memory (RAM) cache, the first thing you might want to tune if you have large caches is to adapt the `MAXMEMORY` variable. This variable controls the maximum amount of memory (RAM) which valkey will use to store cached items.

### Persistent

The persistent Valkey flavor will persist data across container restarts and can be used for queues or application data that will need persistence.

We don't typically suggest using a persistent Valkey for in-memory cache scenarios as this might have unintended side-effects on your application while a Valkey container is restarting and loading data from disk.

## Lagoon adaptions

This image is prepared to be used on Lagoon. There are therefore some things already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions)so this image will work with a random user.
* The files within `/etc/valkey/*` are templated using [`envplate`](https://github.com/kreuzwerker/envplate) via a container-entrypoint.

## Included `valkey.conf` configuration file

The image ships a _default_ Valkey configuration file, optimized to work on Lagoon.

### Environment Variables

Some options are configurable via [environment
variables](../concepts-advanced/environment-variables.md).

| Environment Variable | Default     |                                        Description                                         |
| :------------------- | :---------- | :----------------------------------------------------------------------------------------- |
| DATABASES            | -1          | Default number of databases created at startup.                                            |
| LOGLEVEL             | notice      | Define the level of logs.                                                                  |
| MAXMEMORY            | 100mb       | Maximum amount of memory.                                                                  |
| MAXMEMORYPOLICY      | allkeys-lru | The policy to use when evicting keys if Valkey reaches its maximum memory usage.            |
| VALKEY_FLAVOR        | ephemeral   | The Valkey configuration flavor to load. Can be `ephemeral` or `persistent`. |
| VALKEY_PASSWORD      | disabled    | Enables [authentication feature](https://valkey.io/topics/security#authentication-feature). |

## Custom configuration

By building on the base image you can include custom configuration.
See [https://github.com/valkey-io/valkey/blob/8.1/valkey.conf](https://github.com/valkey-io/valkey/blob/8.1/valkey.conf) for full documentation of the Valkey configuration file.

## Persistent storage

The [Lagoon `valkey` image](https://github.com/uselagoon/lagoon-images/blob/main/images/valkey/6.Dockerfile) will check which flavor of Valkey to use by inspecting the `VALKEY_FLAVOR` env var. When set to `persistent`, the persistent configuration will be loaded.

## Troubleshooting

The Lagoon Valkey images all come pre-loaded with the `valkey-cli` command, which allows for querying the Valkey service for information and setting config values dynamically. To use this utility, you can simply SSH into your Valkey pod by using the instructions [here](../interacting/ssh.md) with `valkey` as the `pod` value then run it from the terminal once you've connected.

### Maximum Memory Policy

By default, the Lagoon `valkey` images are set to use the `allkeys-lru` policy. This policy will alow **ANY** keys stored in Valkey to be evicted if/when the Valkey service hits its `maxmemory` limit according to when the key was least recently used.

For typical installations, this is the ideal configuration, as Drupal may not set a `TTL` value for each key cached in Valkey. If the `maxmemory-policy` is set to something like `volatile-lru` and Drupal doesn't provide these `TTL` tags, this would result in the Valkey container filling up, being totally unable to evict **ANY** keys, and ceasing to accept new cache keys at all.

More information on Valkey' maxmemory policies can be found in Valkey' [official documentation](https://valkey.io/topics/lru-cache/#eviction-policies).

!!! danger "Proceed with Caution"
    Changing this setting can lead to Valkey becoming completely full and cause outages as a result.

### Tuning Valkey' `maxmemory` value

Finding the optimal amount of memory to give Valkey can be quite the difficult task. Before attempting to tune your Valkey cache's memory size, it is prudent to let it run normally for as long as practical, with at least a day of typical usage being the ideal minimum timeframe.

There are a few high level things you can look at when tuning these memory values:

* The first thing to check is the percentage of memory in use by Valkey currently.
  * If this percentage is less than `50%`, you might consider lowering the `maxmemory` value by 25%.
  * If this percentage is between `50%` and `75%`, things are running just fine.
  * If this value is greater than `75%`, then it's worth looking at other variables to see if `maxmemory` needs to be increased.
* If you find that your Valkey' memory usage percentage is high, the next thing to look at is the number of key evictions.
  * A large number of key evictions and a memory usage greater than `95%` is a fairly good indicator that your valkey needs a higher `maxmemory` setting.
  * If the number of key evictions doesn't seem high and typical response times are reasonable, this is simply indicative of Valkey doing its job and managing its allocated memory as expected.

### Example commands

The following commands can be used to view information about the Valkey service:

* View all info about the Valkey service: `valkey-cli info`
* View service memory information: `valkey-cli info memory`
* View service keyspace information: `valkey-cli info keyspace`
* View service statistics: `valkey-cli info stats`

It is also possible to set values for the Valkey service dynamically without a restart of the Valkey service. It is important to note that these dynamically set values will not persist if the pod is restarted (which can happen as a result of a deployment, maintenance, or even just being shuffled from one node to another).

* Set `maxmemory` config value dynamically to `500mb`: `config set maxmemory 500mb`
* Set `maxmemory-policy` config value dynamically to `volatile-lru`: `config set maxmemory-policy volatile-lru`
