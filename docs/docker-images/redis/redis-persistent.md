# redis-persistent

[Lagoon `redis-persistent` Docker image](https://github.com/amazeeio/lagoon/blob/master/images/redis-persistent/Dockerfile), based on [Lagoon `redis` image](https://github.com/AlannaBurke/lagoon/tree/3099c4aeaf2a67cc1e084cb7b8b01ef0fbf90bed/docs/docker-images/redis/redis.md), is intended for use if the Redis service must be in `persistent` mode \(ie. with a persistent volume where transactions will be saved\).

It differs from `redis` only for `FLAVOR` environment variable.

