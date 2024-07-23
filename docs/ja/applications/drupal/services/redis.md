# Redis

内部キャッシングには、[Redis](https://redis.io/)の使用を推奨します。Redisサービスを `docker-compose.yaml`に追加します。

```yaml title="docker-compose.yml"
  redis:
    image: uselagoon/redis-5
    labels:
      lagoon.type: redis
    << : *default-user # 定義済みのユーザーを使用します。
    environment:
      << : *default-environment
```

また、Redisを設定するには、以下を`settings.php`に追加します。

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

ファイルシステムの構造によっては、モジュールのパスを更新する必要があるかもしれません。

## Drupal 8

Drupal 8 の設定はほとんどデフォルト設定のままですが、インストール時に Redis は無効化されます。

```php title="settings.php"
if (getenv('LAGOON')){
  $settings['redis.connection']['interface'] = 'PhpRedis';
  $settings['redis.connection']['host'] = getenv('REDIS_HOST') ?: 'redis';
  $settings['redis.connection']['port'] = getenv('REDIS_SERVICE_PORT') ?: '6379';
  $settings['cache_prefix']['default'] = getenv('LAGOON_PROJECT') . '_' . getenv('LAGOON_GIT_SAFE_BRANCH');

  // Drupalのインストール中にキャッシュを設定しない。
  if (!drupal_installation_attempted() && extension_loaded('redis')) {
    $settings['cache']['default'] = 'cache.backend.redis';

    // そして、Redisモジュールが有効になっていなくても使用できます。
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

### 永続性

Redisは、永続的なバックエンドとして設定することもできます。

```yaml title="docker-compose.yml"
redis:
  image: uselagoon/redis-5-persistent
  labels:
    lagoon.type: redis-persistent
  environment:
    << : *default-environment
```

## 環境変数 { #environment-variables }

環境変数は、Redisに関する一般的な情報を保存するためのものです。

| 環境変数 | デフォルト | 説明 |
| :--- | :--- | :--- |
| `LOGLEVEL` | `notice` | Redisのログレベル |
| `DATABASES` | `1` | データベースの数 |
| `MAXMEMORY` | `100mb` | Redisの最大メモリ使用量 |

## Redisのフェイルオーバー

Redisコンテナが利用できない場合(例えば、メンテナンス中など)にRedisのフェイルオーバーを実装するためのスニペットを以下に示します。

以下をDrupalのアクティブな`settings.php`ファイルに追加します。

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
      // Redisに接続があることを確認します。
      $client = Redis_Client::getClient();
      $response = $client->ping();
      if (!$response) {
      throw new \Exception('Redisにアクセスできましたが、正しく応答していません。');
      }
      $conf['redis_client_interface'] = 'PhpRedis';
      $conf['lock_inc'] = $contrib_path . '/redis/redis.lock.inc';
      $conf['path_inc'] = $contrib_path . '/redis/redis.path.inc';
      $conf['cache_backends'][] = $contrib_path . '/redis/redis.autoload.inc';
      $conf['cache_default_class'] = 'Redis_Cache';
    } catch (\Exception $e) {
      // Redis このリクエストには利用できないため、Redisバックエンドの設定を行わず、キャッシュが使用されないようにします。これにより次のリクエストが再試行されます。
      // 'DrupalFakeCache'クラスが存在しない場合
      if (!class_exists('DrupalFakeCache')) {
        $conf['cache_backends'][] = 'includes/cache-install.inc';
      }
      $conf['cache_default_class'] = 'DrupalFakeCache';
    }
  }
}
```

