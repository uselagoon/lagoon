# Redis

We recommend using [Redis](https://redis.io/) for internal caching. Add the Redis service to `docker-compose.yaml`.

```yaml title="docker-compose.yml"
  redis:
    image: uselagoon/redis-5
    labels:
      lagoon.type: redis
    << : *default-user # Uses the defined user from top.
    environment:
      << : *default-environment
```

Also, to configure Redis, add the following to your `settings.php`.

## Drupal 7

```php title="settings.php"
  if(getenv('LAGOON')){
    $conf['redis_client_interface'] = 'PhpRedis';
    $conf['redis_client_host'] = 'redis';
    $conf['lock_inc'] = 'sites/all/modules/contrib/redis/redis.lock.inc';
    $conf['path_inc'] = 'sites/all/modules/contrib/redis/redis.path.inc';
    $conf['cache_backends'][] = 'sites/all/modules/contrib/redis/redis.autoload.inc';
    $conf['cache_default_class'] = 'Redis_Cache';
    $conf['cache_class_cache_form'] = 'DrupalDatabaseCache';
    $conf['cache_class_cache_field'] = 'DrupalDatabaseCache';
  }
```

Depending on file system structure, the module paths may need to be updated.

## Drupal 8

The Drupal 8 config is largely stock. Notably, Redis is disabled while Drupal is being installed.

```php title="settings.php"
if (getenv('LAGOON')){
  $settings['redis.connection']['interface'] = 'PhpRedis';
  $settings['redis.connection']['host'] = getenv('REDIS_HOST') ?: 'redis';
  $settings['redis.connection']['port'] = getenv('REDIS_SERVICE_PORT') ?: '6379';
  $settings['cache_prefix']['default'] = getenv('LAGOON_PROJECT') . '_' . getenv('LAGOON_GIT_SAFE_BRANCH');

  // Do not set the cache during installations of Drupal.
  if (!drupal_installation_attempted() && extension_loaded('redis')) {
    $settings['cache']['default'] = 'cache.backend.redis';

    // And allows to use it without the Redis module being enabled.
    $class_loader->addPsr4('Drupal\\redis\\', 'modules/contrib/redis/src');

    $settings['bootstrap_container_definition'] = [
      'parameters' => [],
      'services' => [
        'redis.factory' => [
          'class' => 'Drupal\redis\ClientFactory',
        ],
        'cache.backend.redis' => [
          'class' => 'Drupal\redis\Cache\CacheBackendFactory',
          'arguments' => ['@redis.factory', '@cache_tags_provider.container', '@serialization.phpserialize'],
        ],
        'cache.container' => [
          'class' => '\Drupal\redis\Cache\PhpRedis',
          'factory' => ['@cache.backend.redis', 'get'],
          'arguments' => ['container'],
        ],
        'cache_tags_provider.container' => [
          'class' => 'Drupal\redis\Cache\RedisCacheTagsChecksum',
          'arguments' => ['@redis.factory'],
        ],
        'serialization.phpserialize' => [
          'class' => 'Drupal\Component\Serialization\PhpSerialize',
        ],
      ],
    ];
  }
}
```

### Persistent

Redis can also be configured as a persistent backend.

```yaml title="docker-compose.yml"
redis:
  image: uselagoon/redis-5-persistent
  labels:
    lagoon.type: redis-persistent
  environment:
    << : *default-environment
```

## Environment Variables

Environment variables are meant to store some common information about Redis.

| Environment Variable | Default | Description |
| :--- | :--- | :--- |
| `LOGLEVEL` | `notice` | Redis loglevel |
| `DATABASES` | `1` | Number of databases |
| `MAXMEMORY` | `100mb` | Maximum memory usage of Redis |

## Redis Failover

Here is a snippet to implement a Redis failover in case of the Redis container not being available \(for example, during maintenance\)

The following is inserted into Drupal's active `settings.php` file.

```php title="settings.php"
if (getenv('LAGOON')) {
  $contrib_path = is_dir('sites/all/modules/contrib') ? 'sites/all/modules/contrib' : 'sites/all/modules';
  $redis = DRUPAL_ROOT . '/sites/all/modules/contrib/redis';

  if (file_exists("$redis/redis.module")) {
    require_once "$redis/redis.module";
    $conf['redis_client_host'] = getenv('REDIS_HOST') ?: 'redis';
    $conf['redis_client_port'] = getenv('REDIS_SERVICE_PORT') ?: 6379;
    $conf['cache_prefix'] = getenv('REDIS_CACHE_PREFIX') ?: getenv('LAGOON_PROJECT') . '_' . getenv('LAGOON_GIT_SAFE_BRANCH');
    try {
      // Ensure that there is a connection to redis.
      $client = Redis_Client::getClient();
      $response = $client->ping();
      if (!$response) {
      throw new \Exception('Redis could be reached but is not responding correctly.');
      }
      $conf['redis_client_interface'] = 'PhpRedis';
      $conf['lock_inc'] = $contrib_path . '/redis/redis.lock.inc';
      $conf['path_inc'] = $contrib_path . '/redis/redis.path.inc';
      $conf['cache_backends'][] = $contrib_path . '/redis/redis.autoload.inc';
      $conf['cache_default_class'] = 'Redis_Cache';
    } catch (\Exception $e) {
      // Redis is not available for this request we should not configure the
      // redis backend and ensure no cache is used. This will retry next
      // request.
      if (!class_exists('DrupalFakeCache')) {
        $conf['cache_backends'][] = 'includes/cache-install.inc';
      }
      $conf['cache_default_class'] = 'DrupalFakeCache';
    }
  }
}
```
