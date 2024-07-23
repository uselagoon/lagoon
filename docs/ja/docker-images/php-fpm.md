# PHP-FPM

[Lagoonの `php-fpm` Dockerイメージ](https://github.com/uselagoon/lagoon-images/blob/main/images/php-fpm)です。[公式のPHP Alpineイメージ](https://hub.docker.com/_/php/)をベースに作成されています。

>_PHP-FPM(FastCGI Process Manager)は、FastCGI プロトコルを利用した PHP の実装のひとつで、様々な規模のサイト、特にトラフィックが多いサイト向けに便利な追加機能を備えています。_
>
>  * 出典: [https://php-fpm.org/](https://php-fpm.org/)
>
> FastCGIは、サーバースクリプトが時間のかかるコードをスクリプトがロードされる毎度ではなく、一度だけ実行できるようにする仕組みです。これにより、オーバーヘッドを削減します。

!!! Info "情報"
    Dockerfileは、Lagoon内で`PHP`を利用するためのベースとして使用する想定です。このイメージ自体がウェブサーバーを作成するのではなく、`php-fpm`によるFastCGIリスナーを作成します。`php-fpm`プールの設定を調整する必要が生じるかもしれません。

## サポートされているバージョン { #supported-versions }

* 7.3 (互換性のためのみ利用可能、公式サポートは終了しています) - `uselagoon/php-7.3-fpm`
* 7.4 (互換性のためのみ利用可能、公式サポートは終了しています) - `uselagoon/php-7.4-fpm`
* 8.0 (互換性のためのみ利用可能、公式サポートは終了しています) - `uselagoon/php-8.0-fpm`
* 8.1 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-fpm/8.1.Dockerfile) (2024年11月までのセキュリティサポート) - `uselagoon/php-8.1-fpm`
* 8.2 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-fpm/8.2.Dockerfile) (2025年12月までのセキュリティサポート) - `uselagoon/php-8.2-fpm`
* 8.3 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-fpm/8.3.Dockerfile) (2026年12月までのセキュリティサポート) - `uselagoon/php-8.3-fpm`

すべてのPHPバージョンはそれぞれのDockerfilesを使用します。

!!! Tip "ヒント"
    Lagoonは、公式にアナウンスされた終了日(EOL)の後にリリースされるバージョンで、EOLに達したPHPイメージの更新を停止します。詳細は[https://www.php.net/supported-versions.php](https://www.php.net/supported-versions.php)を参照して下さい。

## Lagoonの適応 { #lagoon-adaptions }

このイメージはLagoonで使用されることを想定して準備されています。そのため、すでにいくつかのことが行われています:

* フォルダの権限は、[`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions)で自動的に適応されるため、このイメージはランダムなユーザーで動作します。
* `/usr/local/etc/php/php.ini` および `/usr/local/etc/php-fpm.conf`ファイル、`/usr/local/etc/php-f pm.d/`ディレクトリ内の全てのファイルは、コンテナエントリーポイントを通して[`envplate`](https://github.com/kreuzwerker/envplate)で処理されます。
* インストールされている `PHP` 拡張機能については、[Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-fpm/8.0.Dockerfile)を参照してください。
* さらなる拡張機能をインストールするには、このイメージをもとにDockerfileを拡張してください。拡張機能のインストール方法は、ドキュメント[How to install more PHP extensions.](https://github.com/docker-library/docs/blob/master/php/README.md#how-to-install-more-php-extensions)を参照してください。

## PHP設定

`PHP` 設定には、`PHP`プール設定の作成を容易にするための適切な値が設定されています。以下はその一部のリストです。詳細は`/usr/local/etc/php.ini`、`/usr/local/etc/php-fpm.conf` を確認してください:

| 値 | 詳細 |
| :--- | :--- |
| `max_execution_time = 900` | `PHP_MAX_EXECUTION_TIME` で変更可能 |
| `realpath_cache_size = 256k` | 大規模なPHPプロジェクトを扱うための設定 |
| `memory_limit = 400M` | 大規模なPHPプロジェクトを扱うための設定(`PHP_MEMORY_LIMIT` で変更可能) |
| `opcache.memory_consumption = 265` | 大規模なPHPプロジェクトを扱うための設定 |
| `opcache.enable_file_override = 1` と `opcache.huge_code_pages = 1` | より高速なPHPのための設定 |
| `display_errors = Off` と `display_startup_errors = Off` | 実用的なproduction設定 \(`PHP_DISPLAY_ERRORS` および `PHP_DISPLAY_STARTUP_ERRORS` で変更可能\)。 |
| `upload_max_filesize = 2048M` | 大容量ファイルのアップロードのための設定 |
| `apc.shm_size = 32m` と `apc.enabled = 1` | `PHP_APC_SHM_SIZE` および `PHP_APC_ENABLED` で変更可能 |

また、`php-fpm`のエラーログは `stderr`に記録されます。

**💡 これらの設定のいずれも気に入らない場合は、次の3つの方法があります:**

1. 設定値が環境変数で変更できる場合は、環境変数を使ってください(これが推奨される方法です。[環境変数の表](php-fpm.md#environment-variables)\ の詳細は以下の表にまとめてありますので、参照ください。)
2. 以下のドキュメントにある`php_admin_value`および`php_admin_flag`を使って、独自のカスタム`fpm-pool`設定を作成し、それを適用することができます。
  - 詳細については、[`PHP を Apache モジュールとして実行するためのこのドキュメント`](https://www.php.net/manual/en/configuration.changes.php) を参照してください。このドキュメントはApacheモジュールとしてのPHP実行について説明していますが、`php-fpm` にも当てはまります。<br><br>
  _重要:_
    - 独自の `php-fpm` プールを適用したい場合は、`/usr/local/etc/php-fpm.d/www.conf`ファイルを自分の設定で上書きするか、別の名前を付けたい場合はこのファイル名を変更してください。この操作を行わないと、最初から用意されているプールが起動します。
    - [`PHP_INI_SYSTEM`変更可能モード](https://www.php.net/manual/ja/configuration.changes.modes.php)のPHPの設定値は、`fpm-pool`設定では変更できません。こういった設定値は、用意されている環境変数を使うか、または:
    - 独自の`php.ini`または`php-fpm.conf`ファイルを用意する必要があります(この方法は推奨されません)

## デフォルトのfpm-pool

このイメージは、`fpm-pool`設定ファイル([`php-fpm.d/www.conf`](https://github.com/uselagoon/lagoon-images/blob/main/images/php-fpm/php-fpm.d/www.conf))が含まれており、このファイルは`fpm-pool`を作成し、ポート9000でリッスンします。これは、ほとんどのPHPアプリケーションのニーズを最初からカバーできるようにするためです。もちろん、必要に応じて独自の設定を作成することもできます。

このファイルの内容の説明:

* IPv4とIPv6でポート9000でリッスンします。
* pm `dynamic`を使用し、2から50までの子プロセスを作成します。
* メモリリークを防ぐために、500のリクエスト後に`php-fpm`プールの子プロセスを再生成します。
* `/ping`へのfastcgiリクエストに対して`pong`で応答します(プールが起動しているかどうかの自動テストに便利)。
* `catch_workers_output = yes`により、PHPのエラーを確認できるようにする。
* `clear_env = no`により、通常の Docker 環境変数を使って PHP 環境変数を注入できるようにする

## 環境変数 { #environment-variables }

一部のオプションは[環境変数](../concepts-advanced/environment-variables.md)で設定可能です。

| 環境変数                             | デフォルト  | 説明                                                                     |
| :----------------------------------- | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| NEWRELIC_ENABLED                     | false     | NewRelicのパフォーマンスモニタリングを有効にします。有効にするには`NEWRELIC_LICENSE`を設定する必要がありますす。          |
| NEWRELIC_LICENSE                     | (設定なし)  | 使用するNewRelicのライセンス。重要:NewRelicを有効にするには`NEWRELIC_ENABLED`を`true`に設定する必要があります。                                      |
| NEWRELIC_BROWSER_MONITORING_ENABLED  | true      | NewRelicブラウザ監視用のJavaScriptフラグメントの自動挿入を有効にします。重要:NewRelicを有効にするには`NEWRELIC_ENABLED`を`true`に設定する必要があります。 |
| NEWRELIC_DISTRIBUTED_TRACING_ENABLED | false     | 分散トレースを有効にします。重要:NewRelicを有効にするには、`NEWRELIC_ENABLED`を`true`に設定する必要があります。                            |
| PHP_APC_ENABLED                      | 1         | [APC](https://www.php.net/manual/en/apcu.configuration.php)を無効にするには`0`を設定します。                                        |
| PHP_APC_SHM_SIZE                     | 32m       | 各共有メモリセグメントのサイズ。                                                      |
| PHP_DISPLAY_ERRORS                   | Off       | エラーを表示されるか非表示にするかを設定します。詳細は、[php.net](https://www.php.net/display-errors)を参照してください。                                                      |
| PHP_DISPLAY_STARTUP_ERRORS           | Off       | 起動時のエラーを表示するか非表示するかを設定します。詳細は、[php.net](https://www.php.net/display-startup-errors)を参照してください。                                      |
| PHP_ERROR_REPORTING                  | Production `E_ALL & ~E _DEPRECATED & ~E_STRICT` Development: `E_ALL & ~E_DEPRECATED & ~E_STRICT & ~E_NOTICE` | PHPに使用されるdesired loggingレベルを設定します。詳細は、[php.net](https://www.php.net/manual/en/function.error-reporting.php)を参照してください。 |
| PHP_FPM_PM_MAX_CHILDREN              | 50        | 子プロセスの最大数。詳細は、[php.net](https://www.php.net/manual/en/install.fpm.configuration.php)を参照。                                 |
| PHP_FPM_PM_MAX_REQUESTS              | 500       | 各子プロセスが再生成される前に実行するべきリクエストの数。詳細は、[php.net](https://www.php.net/manual/en/install.fpm.configuration.php)を参照してください。 |
| PHP_FPM_PM_MAX_SPARE_SERVERS         | 2         | アイドル状態のサーバープロセスの最大許容数を設定します。詳細は、[php.net](https://www.php.net/manual/en/install.fpm.configuration.php)を参照してください。                       |
| PHP_FPM_PM_MIN_SPARE_SERVERS         | 2         | アイドル状態のサーバープロセスの最小許容数を設定します。詳細は、[php.net](https://www.php.net/manual/en/install.fpm.configuration.php)を参照してください。                       |
| PHP_FPM_PM_PROCESS_IDLE_TIMEOUT      | 60s       | アイドル状態のプロセスが終了されるまでの秒数。詳細は、[php.net](https://www.php.net /manual/ja/install.fpm.configuration.php)を参照してください。               |
| PHP_FPM_PM_START_SERVERS             | 2         | 起動時に作成される子プロセスの数。詳細は、[php.net](https://www.php.net/manual/ja/install.fpm.configuration.php)を参照してください。                            |
| PHP_MAX_EXECUTION_TIME               | 900       | 各スクリプトの最大実行時間(秒)。詳細は、[php.net](https://www.php.net/max-execution-time)を参照してください。                                                |
| PHP_MAX_FILE_UPLOADS                 | 20        | 同時にアップロードできるファイルの最大数。詳細は、[php.net](https://www.php.net/manual/ja/ini.core.php#ini.max-file-uploads)を参照してください。       |
| PHP_MAX_INPUT_VARS                   | 2000      | 受け入れ可能な入力変数の数。詳細は、[php.net](https://www.php.net/manual/ja/info.configuration.php#ini.max-input-vars)を参照してください。                       |
| PHP_MEMORY_LIMIT                     | 400M      | スクリプトが消費できるメモリの最大量。詳細は、[php.net](https://www.php.net/memory-limit)を参照してください。                                                          |
| XDEBUG_ENABLE                        | (設定なし) | `xdebug` 拡張機能を有効にするには、`true`に設定します。 |
| BLACKFIRE_ENABLED                    | (設定なし) | `blackfire` 拡張機能を有効にするには `true` に設定します。                                                                                                           |
| BLACKFIRE_SERVER_ID                  | (設定なし) | Blackfire.ioが提供するBlackfireサーバーID。`BLACKFIRE_ENABLED`を`true`に設定する必要があります。                                                             |
| BLACKFIRE_SERVER_TOKEN               | (設定なし) | Blackfire.ioが提供するBlackfireサーバートークン。`BLACKFIRE_ENABLED`を`true`に設定する必要があります。                                                          |
| BLACKFIRE_LOG_LEVEL                  | 3         | blackfireエージェントのログレベルを変更します。利用可能な値:`ログの冗長性レベル (4: デバッグ, 3: 情報, 2: 警告, 1: エラー)` 詳細は、[blackfire.io](https://blackfire.io/docs/up-and-running/configuration/agent)を参照して下さい。 |
