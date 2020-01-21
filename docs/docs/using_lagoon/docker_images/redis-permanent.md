# Redis persistent Image

Lagoon `redis-persistent` Docker image, based on Lagoon `redis` image, is intended for use if the Redis service must be in `persistent` mode \(ie. with a persistent volume where transactions will be saved\).  
It differs from `redis` only for `FLAVOR` environment variable.

