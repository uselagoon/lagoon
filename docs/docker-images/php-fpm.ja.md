# PHP-FPM

[Lagoonの `php-fpm` Dockerイメージ](https://github.com/uselagoon/lagoon-images/blob/main/images/php-fpm)です。[公式のPHP Alpineイメージ](https://hub.docker.com/_/php/)に基づいています。

>_PHP-FPM（FastCGIプロセスマネージャ）は、追加機能を備えた代替PHP FastCGIの実装で、任意のサイズのサイト、特に忙しいサイトに役立ちます。_
>
> [https://php-fpm.org/](https://php-fpm.org/)より
>
> FastCGIは、サーバースクリプトがタイムコンシューミングなコードを一度だけ実行する方式で、スクリプトがロードされるたびに実行されるのを防ぎ、オーバーヘッドを軽減します。

!!! 情報
    このDockerfileは、Lagoon内での任意の`PHP`ニーズの基盤として使用することを目的としています。このイメージ自体はウェブサーバーを作成せず、`php-fpm` fastcgiリスナーを作成します。`php-fpm`プール設定を適応させる必要があるかもしれません。

## サポートされているバージョン

* 7.3 (互換性を保つためのみに利用可能、公式サポートは終了) - `uselagoon/php-7.3-fpm`
* 7.4 (互換性を保つためのみに利用可能、公式サポートは終了) - `uselagoon/php-7.4-fpm`
* 8.0 (互換性を保つためのみに利用可能、公式サポートは終了) - `uselagoon/php-8.0-fpm`
* 8.1 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main /images/php-fpm/8.1.Dockerfile) (2024年11月までのセキュリティサポート) - `uselagoon/php-8.1-fpm`
* 8.2 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-fpm/8.2.Dockerfile) (2025年12月までのセキュリティサポート) - `uselagoon/php-8.2-fpm`
* 8.3 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-fpm/8.3.Dockerfile) (2026年12月までのセキュリティサポート) - `uselagoon/php-8.3-fpm`

すべてのPHPバージョンはそれぞれのDockerfilesを使用します。

!!! ヒント
    End of Life \(EOL\) PHP画像の更新は通常、公式に発表されたEOL日付の後のLagoonリリースで停止します：[https://www.php.net/supported-versions.php](https://www.php.net/supported-versions.php)。以前に公開されたバージョンは利用可能なままとなります。

## Lagoonの適応

このイメージはLagoonで使用するために準備されています。そのため、すでにいくつかのことが行われています：

* フォルダの権限は[`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions)で自動的に適応されますので、この画像はランダムなユーザーで動作します。
* `/usr/local/etc/php/php.ini` および `/usr/local/etc/php-fpm.conf`、および `/usr/local/etc/php-f pm.d/`は、コンテナエントリーポイントを経由して[`envplate`](https://github.com/kreuzwerker/envplate)で解析されます。
* インストールされている `PHP` 拡張機能については、[Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-fpm/8.0.Dockerfile)を参照してください。
* さらなる拡張機能をインストールするには、このイメージからDockerfileを拡張します。ドキュメントに従って拡張機能をインストールしてください。見出し[How to install more PHP extensions.](https://github.com/docker-library/docs/blob/master/php/README.md#how-to-install-more-php-extensions)を参照。

## 含まれるPHP設定

含まれる `PHP` 設定には、`PHP` プール設定の作成を容易にする合理的な値が含まれています。以下にいくつかを挙げます。すべてについては `/usr/local/etc/php.ini`、`/usr/local/etc/php-fpm.conf` を確認してください：

| 値 | 詳細 |
| :--- | :--- |
| `max_execution_time = 900` | `PHP_MAX_EXECUTION_TIME` で変更可能。 |
| `realpath_cache_size = 256k` | 大規模なPHPプロジェクトのため。 |
| `memory_limit = 400M` | 大規模なPHPプロジェクトのため（`PHP_MEMORY_LIMIT` で変更可能）。 |
| `opcache.memory_consumption = 265` | 大規模なPHPプロジェクトのため。 |
| `opcache.enable_file_override = 1` と `opcache.huge_code_pages = 1` | 高速なPHPのため。 |
| `display Translation request timed out. 提供されたプールが開始されます！
      2. [`PHP_INI_SYSTEM`変更可能モード](https://www.php.net/manual/ja/configuration.changes.modes.php)を持つPHPの値は、`fpm-pool`設定を介して変更できません。すでに提供されている環境変数または以下の方法で変更する必要があります：
3. 独自の`php.ini`または`php-fpm.conf`ファイルを提供します（これは最も好ましくない方法です）。

## デフォルトのfpm-pool

このイメージは、`fpm-pool`設定（[`php-fpm.d/www.conf`](https://github.com/uselagoon/lagoon-images/blob/main/images/php-fpm/php-fpm.d/www.conf)）が付属しており、`fpm-pool`を作成し、ポート9000でリッスンします。これは、PHPのほとんどのニーズをすでにカバーしているイメージを提供しようとしているためです。もし好きなら、自分自身で作成することも歓迎します！

このファイルが何をするかの短い説明：

* IPv4とIPv6でポート9000でリッスンします。
* pm `dynamic`を使用し、2-50の子を作成します。
* メモリリークを防ぐために、500のリクエスト後に`php-fpm`プールの子を再生成します。
* `/ping`へのfastcgiリクエストに`pong`で応答します（プールが起動したかどうかを自動テストで確認するのに便利）。
* PHPのエラーを見るために`catch_workers_output = yes`。
* `clear_env = `を使用して、通常のDocker環境変数経由でPHP環境変数を注入できます。

## 環境変数

一部のオプションは[環境変数](../concepts-advanced/environment-variables.md)経由で設定可能です。

| 環境変数                             | デフォルト  | 説明                                                                                                                                                |
| :----------------------------------- | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| NEWRELIC_ENABLED                     | false     | NewRelicのパフォーマンスモニタリングを有効にします。`NEWRELIC_LICENSE`の設定が必要です。                                                            |
| NEWRELIC_LICENSE                     | (未設定)  | 使用するNewRelicのライセンス。重要：NewRelicを有効にするには`NEWRELIC_ENABLED`を`true`に設定する必要があります。                                      |
| NEWRELIC_BROWSER_MONITORING_ENABLED  | true      | これにより、NewRelicのブラウザモニタリングのためのJavaScriptフラグメントの自動挿入が有効になります。 . 重要：`NEWRELIC_ENABLED`はNewRelicを有効にするために`true`に設定する必要があります。 |
| NEWRELIC_DISTRIBUTED_TRACING_ENABLED | false     | これにより分散トレーシングが有効になります。重要：`NEWRELIC_ENABLED`はNewRelicを有効にするために`true`に設定する必要があります。                            |
| PHP_APC_ENABLED                      | 1         | [APC](https://www.php.net/manual/en/apcu.configuration.php)を無効にするために`0`に設定することができます。                                                                |
| PHP_APC_SHM_SIZE                     | 32m       | 与えられた各共有メモリセグメントのサイズ。                                                                                                            |
| PHP_DISPLAY_ERRORS                   | Off       | エラーが表示されるか非表示にされるかを設定します。[php.netを参照してください](https://www.php.net/display-errors)。                                                      |
| PHP_DISPLAY_STARTUP_ERRORS           | Off       | スタートアップエラーが表示されるか非表示にされるかを設定します。[php.netを参照してください](https://www.php.net/display-startup-errors)。                                      |
| PHP_ERROR_REPORTING                  | Production `E_ALL & ~E _DEPRECATED & ~E_STRICT` 開発: `E_ALL & ~E_DEPRECATED & ~E_STRICT & ~E_NOTICE` | PHPが使用するログレベルを設定します。[php.netを参照](https://www.php.net/manual/en/function.error-reporting.php) |
| PHP_FPM_PM_MAX_CHILDREN              | 50        | 子プロセスの最大数。[php.netを参照](https://www.php.net/manual/en/install.fpm.configuration.php)。                                 |
| PHP_FPM_PM_MAX_REQUESTS              | 500       | 各子プロセスが再生成される前に実行するべきリクエストの数。[php.netを参照](https://www.php.net/manual/en/install.fpm.configuration.php)。 |
| PHP_FPM_PM_MAX_SPARE_SERVERS         | 2         | アイドル状態のサーバープロセスの最大数を設定します。[php.netを参照](https://www.php.net/manual/en/install.fpm.configuration.php)。                       |
| PHP_FPM_PM_MIN_SPARE_SERVERS         | 2         | アイドル状態のサーバープロセスの最小数を設定します。[php.netを参照](https://www.php.net/manual/en/install.fpm.configuration.php)。                       |
| PHP_FPM_PM_PROCESS_IDLE_TIMEOUT      | 60s       | アイドルプロセスが強制終了されるまでの秒数。[php.netを参照](https://www.php.net /manual/ja/install.fpm.configuration.php)。               |
| PHP_FPM_PM_START_SERVERS             | 2         | 起動時に作成される子プロセスの数。 [php.netを参照](https://www.php.net/manual/ja/install.fpm.configuration.php)。                            |
| PHP_MAX_EXECUTION_TIME               | 900       | 各スクリプトの最大実行時間（秒）。 [php.netを参照](https://www.php.net/max-execution-time)。                                                |
| PHP_MAX_FILE_UPLOADS                 | 20        | 同時にアップロードできるファイルの最大数。 [php.netを参照](https://www.php.net/manual/ja/ini.core.php#ini.max-file-uploads)。       |
| PHP_MAX_INPUT_VARS                   | 2000      | 受け入れ可能な入力変数の数。 [php.netを参照](https://www.php.net/manual/ja/info.configuration.php#ini.max-input-vars)。                       |
| PHP_MEMORY_LIMIT                     | 400M      | スクリプトが消費できるメモリの最大量。 [php.netを参照](https://www.php.net/memory-limit)。                                                          |
| XDEBUG_ENABLE                        | (設定なし) | `xdebug` 拡張機能を有効にするには、`true`に設定します。 |
| BLACKFIRE_ENABLED                    | (設定されていません) | `blackfire` 拡張機能を有効にするには `true` に設定します。                                                                                                           |
| BLACKFIRE_SERVER_ID                  | (設定されていません) | Blackfire.io から提供されている Blackfire サーバー ID に設定します。`BLACKFIRE_ENABLED` を `true` に設定する必要があります。                                                             |
| BLACKFIRE_SERVER_TOKEN               | (設定されていません) | Blackfire.io から提供されている Blackfire サーバートークンに設定します。`BLACKFIRE_ENABLED` を `true` に設定する必要があります。                                                          |
| BLACKFIRE_LOG_LEVEL                  | 3         | blackfire エージェントのログレベルを変更します。利用可能な値：`ログの冗長性レベル (4: デバッグ, 3: 情報, 2: 警告, 1: エラー)` [blackfire.ioを参照](https://blackfire.io/docs/up-and-running/configuration/agent)。 |