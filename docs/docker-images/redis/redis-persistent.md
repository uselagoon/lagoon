# redis-persistent

[Lagoon `redis-persistent` Docker image](https://github.com/amazeeio/lagoon/blob/master/images/redis-persistent/Dockerfile), based on [Lagoon `redis` image](https://github.com/AlannaBurke/lagoon/tree/3f1ab2ee09facee10abd8009345e30ef31e20189/docker-images/redis/redis.md), is intended for use if the Redis service must be in `persistent` mode \(ie. with a persistent volume where transactions will be saved\).

It differs from `redis` only for `FLAVOR` environment variable.

