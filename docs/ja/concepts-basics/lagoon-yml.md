# .lagoon.yml

`.lagoon.yml` ファイルは、プロジェクトを設定するための中心的なファイルです。以下の操作を行うための設定が含まれています：

* [サイトへのアクセスルートを定義する](lagoon-yml.md#routes)。
* [プレロールアウトタスクを定義する](lagoon-yml.md#pre-rollout-tasks-pre_rolloutirun)。
* [ポストロールアウトタスクを定義する](lagoon-yml.md#post-rollout-tasks-post_rolloutirun)。
* [SSL証明書を設定する](lagoon-yml.md#ssl-configuration-tls-acme)。
* [環境のためのcronジョブを追加する](lagoon-yml.md#environmentsnamecronjobs)。

`.lagoon.yml` ファイルは、Gitリポジトリのルートに配置する必要があります。

## 一般設定 { #general-settings }

### `docker-compose-yaml` { #docker-compose-yaml }

この設定は、ビルドスクリプトにどのDocker Compose YAMLファイルを使用するべきかを指示します。これにより、どのサービスとコンテナがデプロイされるべきかを理解します。これはデフォルトで `docker-compose.yml` を指しますが、必要に応じて特定のLagoon Docker Compose YAMLファイルに使用することもできます。

### `environment_variables.git_sha` { #environment_variablesgit_sha }

この設定は、デプロイされたGit SHAを環境変数としてプロジェクトに注入することを有効にすることができます。デフォルトではこれは無効です。値を `true` に設定すると、SHAが環境変数 `LAGOON_GIT_SHA` として設定されます。

## ルート { #routes }

ルートはトラフィックを指向するために使用されます サービスに。環境内の各サービスにはルートがあり、ドメイン名は手動または自動で定義されます。トップレベルの `routes` セクションは、すべての環境のすべてのルートに適用されます。

### `routes.autogenerate` { #routesautogenerate }

これにより、自動的に作成されるルートを設定できます。[手動ルート](#environmentsnameroutes)は環境ごとに定義されます。

* `enabled`: 自動生成されたルートを無効にするには、`false`に設定します。デフォルトは`true`です。
* `allowPullrequests`: プルリクエストのために `enabled: false`を上書きするには、`true`に設定します。

    ```yaml title=".lagoon.yml"
    routes:
      autogenerate:
        enabled: false
        allowPullrequests: true
    ```

* `insecure`: HTTP接続を設定します。デフォルトは`Allow`です。
  * `Allow`: ルートはHTTPとHTTPSの両方に応答します。
  * `Redirect`: ルートは任意のHTTPリクエストをHTTPSにリダイレクトします。

* `prefixes`: 各環境の自動生成されたルートのプレフィクスを設定します。これは、言語プレフィクスドメインやDrupalの`domain`モジュールを使用したマルチドメインサイトなどに便利です。

  ```yaml title=".lagoon.yml"
    routes:
      autogenerate:
        prefixes:
        - www
        - de
        - fr
        - it
  ```

## タスク { #tasks }

以下のようなものがあります ビルドフローで正確にどのタイミングで実行されるかによって異なるタスクの種類を定義することができます：

### プリロールアウトタスク - `pre_rollout.[i].run` { #pre-rollout-tasks-pre_rolloutirun }

ここでは、すべてのイメージが正常にビルドされた後、_しかし_以下の前に、プロジェクトに対して実行するタスクを指定することができます：

* 新規にビルドされたイメージで実行中のコンテナが更新される。
* 既存の環境に他の変更が加えられる。

この機能を利用すると、たとえば、アプリケーションを更新する前にデータベースダンプを作成するなどのことが可能になります。この機能は、デプロイに問題が発生した場合のロールバックを容易にします。

!!! 情報
    プリロールアウトタスクは_更新前の既存のポッド内で実行されます_、つまり：

    * 最後のデプロイ以降にDockerfileに加えられた変更は、プリロールアウトタスクが実行されるときには表示されません。
    * 既存のコンテナがない場合（例えば、新しい環境の初期デプロイメント時など）、プリロールアウトタスクはスキップされます。

### ポストロールアウトタスク - `post_rollout.[i].run` #post-rollout-tasks-post_rolloutirun

ここでは、以下の後に、プロジェクトに対して実行する必要があるタスクを指定することができます：

* 全てのイメージが正常にビルドされる。
* 全てのコンテナが新しいイメージで更新される。
* 全てのコンテナが稼働し、その準備が整った後。 チェック。

ポストロールアウトタスクの一般的な使用例には、`drush updb`、`drush cim`の実行や、さまざまなキャッシュのクリアなどが含まれます。

* `name`
  * 名前は、ログ内の各タスクを識別するための任意のラベルです。
* `command`
  * ここでは、実行するべきコマンドを指定します。これらは、各コンテナのWORKDIRで実行されます。Lagoonのイメージの場合、これは`/app`です。タスクを実行するために特定の場所に`cd`する必要がある場合は、これを念頭に置いてください。
* `service`
  * タスクを実行するサービス。Drupalの例に従っている場合、これはCLIコンテナになります。なぜなら、あなたのサイトのコード、ファイル、データベースへの接続がすべて含まれているからです。通常、これを変更する必要はありません。
* `container`
  * サービスが複数のコンテナを持っている場合（例：`nginx-php`）、ポッド内で接続するコンテナを指定する必要があります（例：`nginx`ポッド内の`php`コンテナ）。
* `shell`
  * タスクが実行されるべきシェル。デフォルトでは`sh`が使用されますが、コンテナが他のシェル（`bash`など）も持っている場合は、ここで定義できます。これは、ポストロールアウト内で小さなif/else bashスクリプトを実行したい場合に便利です。[以下の例を参照してください](#example-post-rollout-tasks)、これにより、どのようにして書き込むかを学ぶことができます 複数行のスクリプト。
* `when`
  * "when"節は、タスクの条件付き実行を可能にします。それは真/偽の値に評価される表現を期待しており、タスクを実行するかどうかを決定します。

注: デプロイメント中にpre/post-rolloutタスクを一時的に無効にしたい場合は、APIで以下の環境変数をプロジェクトレベルまたは環境レベルで設定することができます（[環境変数](../concepts-advanced/environment-variables.md)の設定方法についてはここを参照してください）。

* `LAGOON_PREROLLOUT_DISABLED=true`
* `LAGOON_POSTROLLOUT_DISABLED=true`

#### post-rolloutタスクの例 { #example-post-rollout-tasks }

以下は、あなたのプロジェクトに使用したり適応したりしたい、いくつかの有用なpost-rolloutタスクの例です。

Drupalがインストールされていない場合にのみ実行：

```bash title=".lagoon.yml"
- run:
  name: IF no Drupal installed
  command: | # (1)
    if tables=$(drush sqlq "show tables like 'node';") && [ -z "$tables" ]; then
      #### whatever you like
    fi
  service: cli
  shell: bash
```

1. これは、複数行のコマンドを作成する方法を示しています。

ブランチ名に基づいた異なるタスク：

```yaml title=".lagoon.yml"
- run:
    name: Different tasks based on branch name
    command: |
        ### Runs if 現在のブランチは 'production' ではありません
    サービス: cli
    条件: LAGOON_GIT_BRANCH != "production"

シェルスクリプトを実行:

```yaml title=".lagoon.yml"
- run:
    name: Run Script
    command: './scripts/script.sh'
    service: cli
```

ポッド内の特定のコンテナを対象にする：

```yaml title=".lagoon.yml"
- run:
    name: show php env variables
    command: env
    service: nginx
    container: php
```

Drupal & Drush 9: マスター環境からデータベースとファイルを同期：

```bash title=".lagoon.yml"
- run:
    name: Sync DB and Files from master if we are not on master
    command: |
      # Only if we don't have a database yet
      if tables=$(drush sqlq 'show tables;') && [ -z "$tables" ]; then
          drush sql-sync @lagoon.master @self # (1)
          drush rsync @lagoon.master:%files @self:%files -- --omit-dir-times --no-perms --no-group --no-owner --chmod=ugo=rwX
      fi
    service: cli
    when: LAGOON_ENVIRONMENT_TYPE != "production"
```

1. ここではプロジェクトに適したエイリアスを使用してください。

## バックアップの保持期間 { #backup-retention }

### `backup-retention.production.monthly`

Lagoonがプロジェクトの本番環境の月次バックアップを何回保持するべきかを指定します。

グローバル この値が指定されていない場合、デフォルトは `1` です。

### `backup-retention.production.weekly`

Lagoonがあなたのプロジェクトのプロダクション環境で保持すべき週間バックアップの数を指定します。

この値が指定されていない場合、グローバルデフォルトは `6` です。

### `backup-retention.production.daily`

Lagoonがあなたのプロジェクトのプロダクション環境で保持すべき日次バックアップの数を指定します。

この値が指定されていない場合、グローバルデフォルトは `7` です。

### `backup-retention.production.hourly`

Lagoonがあなたのプロジェクトのプロダクション環境で保持すべき毎時バックアップの数を指定します。

この値が指定されていない場合、グローバルデフォルトは `0` です。

## バックアップスケジュール { #backup-schedule }

### `backup-schedule.production`

このプロジェクトのバックアップスケジュールを指定します。ただし、`Minute` ブロックは `M` でなければならず、他の値は Lagoon ビルドを失敗させます。これにより、Lagoonはこれらのバックアップが行われる特定の分をランダムに選択することができ、ユーザーはスケジュールの残りを時間まで指定することができます。

この値が指定されていない場合、グローバルデフォルトは `M H(22-2) * * *` です。注意してください これらのバックアップは、クラスタのローカルタイムゾーンを使用します。

## 環境 { #environments }

環境名は、デプロイされたブランチやプルリクエストと一致します。これにより、各環境で異なる設定を持つことが可能になります。私たちの例では、`main`と`staging`環境に適用されます。

### `environments.[name].routes`

<iframe width="560" height="315" src="https://www.youtube.com/embed/vQxh87F3fW4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

手動ルートは、サービスへのトラフィックを指示するために環境ごとに設定されたドメイン名です。すべての環境がデフォルトで[自動生成されたルート](#routesautogenerate)を取得するため、手動ルートは通常、プロジェクトのウェブサイトのメインドメイン（`www.example.com`など）を使用して本番環境でのみ設定されます。

!!! ヒント
    Lagoonは手動ルートを制御できないので、DNSプロバイダーでDNSレコードが適切に設定されていることを確認する必要があります。自動ルートを指す`CNAME`レコードを設定できる可能性があります。

環境の次の最初の要素はターゲットサービスであり、私たちの場合は`nginx`です。 例えば、これは私たちがどのサービスに入ってくるリクエストを送るかを識別する方法です。

最も単純なルートは `example.com`で、これは私たちの[例の`.lagoon.yml`](#example-lagoonyml)で見ることができます - 追加の設定がないことがわかります。これは、あなたがルートに対してLet's Encrypt証明書を望んでいると仮定し、HTTPSからHTTPへのリダイレクトはありません。

以下の`"www.example.com"`の例では、さらに3つのオプションを見ることができます（また、ルートの終わりにある`:`と、ルートが`"`で囲まれていることに注意してください、これは重要です！）：

```yaml title=".lagoon.yml"
- "www.example.com":
    tls-acme: true
    insecure: Redirect
    hstsEnabled: true
```

### SSL設定 `tls-acme` { #ssl-configuration-tls-acme }

!!! 警告
    `tls-acme: true`から`tls-acme: false`に切り替えると、このルートに対して以前に生成された証明書がすべて削除されます。これは、外部のCDNを使用していて証明書のピン留めを行っている場合、予期しない挙動を引き起こす可能性があります。

* `tls-acme`：Let's Encryptを通じた自動TLS証明書生成を設定します。デフォルトは`true`で、自動証明書を無効にするには`false`に設定します。
* `insecure`：HTTP接続を設定します。デフォルトは`Allow`です。
  * `Allow`：ルートはHTTPとHTTPSに応答します。
  * ` リダイレクト`：ルートはすべてのHTTPリクエストをHTTPSにリダイレクトします。
* `hstsEnabled`： `Strict-Transport-Security`ヘッダーを追加します。デフォルトは
  `false`です。
* `hstsMaxAge`： `max-age`ディレクティブを設定します。デフォルトは `31536000` （1
  年）です。
* `hstsPreload`： `preload`ディレクティブを設定します。デフォルトは `false`です。
* `hstsIncludeSubdomains`： `includeSubDomains`ディレクティブを設定します。デフォルトは
  `false`です。

!!! 情報
    証明書認証機関（CA）によって署名されたSSL証明書からLet's Encrypt証明書に切り替える予定の場合、移行を監視するためにLagoon管理者に連絡することをお勧めします。

### 特定のパスの監視 { #monitoring-a-specific-path }

[UptimeRobot](https://uptimerobot.com/)があなたのクラスター（KubernetesまたはOpenShift）に設定されている場合、Lagoonは各ルート/イングレスに注釈を注入して`stakater/IngressControllerMonitor`が使用します。デフォルトのアクションはルートのホームページを監視することです。特定のルートを監視したい場合、ルート仕様に`monitoring-path`を追加することでこれをオーバーライドできます。一般的な使用法は、キャッシングをバイパスする監視用のパスを設定し、サイトのリアルタイムの監視を可能にすることです。

```yaml title=".lagoon.yml"
- "www .example.com":
      monitoring-path: "/bypass-cache"
```

### Ingressの注釈 { #ingress-annotations }

!!! 警告
    ルート/Ingressの注釈は、nginx-ingressコントローラーを実行するクラスターにデプロイされるプロジェクトのみがサポートしています！これがサポートされているかどうかは、あなたのLagoon管理者に確認してください。

* `annotations`は、[nginx-ingressコントローラーがサポートする注釈](https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/)のYAMLマップです。これは特に、簡単なリダイレクトや他の設定に便利です。

#### 制限事項 { #restrictions }

Lagoonでは、一部の注釈が禁止されているか、部分的に制限されています。
以下の表は、これらのルールを説明しています。

あなたの`.lagoon.yml`がこれらの注釈のいずれかを含んでいる場合、ビルドが失敗する原因となります。

| 注釈                                             | ノート                                                                                    |
| ---                                               | ---                                                                                        |
| `nginx.ingress.kubernetes.io/auth-snippet`        | 禁止されています                                                                             |
| `nginx `.ingress.kubernetes.io/configuration-snippet` | `rewrite`、`add_header`、`set_real_ip`、および `more_set_headers` ディレクティブに制限されています。 |
| `nginx.ingress.kubernetes.io/modsecurity-snippet`   | 不許可                                                                                     |
| `nginx.ingress.kubernetes.io/server-snippet`        | `rewrite`、`add_header`、`set_real_ip`、および `more_set_headers` ディレクティブに制限されています。 |
| `nginx.ingress.kubernetes.io/stream-snippet`        | 不許可                                                                                     |
| `nginx.ingress.kubernetes.io/use-regex`             | 不許可                                                                                     |

#### Ingressのアノテーションリダイレクト { #ingress-annotations-redirects }

この例では、`example.ch`への任意のリクエストが、フォルダーやクエリパラメータを保持したまま `https://www.example.ch`にリダイレクトされます（`example.com/folder?query` -&gt; `https://www.example.ch/folder?query`）。

```yaml title=".lagoon.yml"
- "example.ch":
    annotations:
      nginx.ingress.kubernetes.io/permanent-redirect: https://www.example.ch$request_uri
- www.example.ch
```

もちろん、他の任意の場所にリダイレクトすることも可能です。 LagoonにホストされていないURL、これは`example.de`へのリクエストを`https://www.google.com`にリダイレクトします。

```yaml title=".lagoon.yml"
- "example.de":
    annotations:
      nginx.ingress.kubernetes.io/permanent-redirect: https://www.google.com
```

#### 信頼されるリバースプロキシ { #trusted-reverse-proxies }

!!! 警告
    Kubernetesは単一の`nginx.ingress.kubernetes.io/server-snippet`アノテーションのみを処理します。非本番環境のルートでこのアノテーションを使用する場合は、`add_header X-Robots-Tag "noindex, nofollow";`アノテーションもサーバースニペットの一部として含めてください。これは、開発環境でクローラーがクロールするのを防ぐために、デフォルトのサーバースニペットがingressテンプレートで設定されているものを上書きするために必要です。`.lagoon.yml`で設定された`server-snippets`。

一部の設定では、リバースプロキシ（CDNなど）がKubernetesクラスタの前に配置されます。これらの設定では、リバースプロキシのIPがアプリケーションの`REMOTE_ADDR` `HTTP_X_REAL_IP` `HTTP_X_FORWARDED_FOR`ヘッダー領域として表示されます。リクエスターのオリジナルIPは`HTTP_X_ORIGINAL_FORWARDED_FOR`ヘッダーに見つけることができます。

あなたがあなたのアプリケーションでオリジナルのリクエストIPを必要とするなら、 `REMOTE_ADDR` `HTTP_X_FORWARDED_FOR` `HTTP_X_REAL_IP` ヘッダーに元のIPが表示されるようにするには、信頼したいリバースプロキシのIPをイングレスに伝える必要があります：

```yaml title=".lagoon.yml"
- "example.ch":
    annotations:
      nginx.ingress.kubernetes.io/server-snippet: |
        set_real_ip_from 1.2.3.4/32;
```

この例では、CIDR `1.2.3.4/32`（この場合はIP `1.2.3.4`）を信頼します。したがって、IP `1.2.3.4` からKubernetesクラスターにリクエストが送信されると、`X-Forwarded-For` ヘッダーが分析され、その内容が `REMOTE_ADDR` `HTTP_X_REAL_IP` `HTTP_X_FORWARDED_FOR` ヘッダーに注入されます。

### `Environments.[name].types`

Lagoonのビルドプロセスは、`docker-compose.yml`ファイルから`lagoon.type`ラベルをチェックして、どの種類のサービスがデプロイされるべきかを学習します（[`docker-compose.yml`](docker-compose-yml.md#types)のドキュメンテーションで詳しく読むことができます）。

場合によっては、すべてではなく、単一の環境だけで**type**をオーバーライドしたいことがあります。例えば、非本番環境である` 開発：

`service-name: service-type`

* `service-name`は、`docker-compose.yml`から上書きしたいサービスの名前です。
* `service-type`は、上書きで使用したいサービスの種類です。

MariaDB\_Galeraの設定例：

```yaml title=".lagoon.yml"
environments:
  develop:
    types:
      mariadb: mariadb-single
```

### `environments.[name].templates`

Lagoonのビルドプロセスは、`docker-compose.yml`ファイルから`lagoon.template`ラベルをチェックして、サービスがカスタムテンプレートファイルを必要とするかどうかを確認します（`docker-compose.yml`のドキュメンテーションで詳しく読むことができます）。

場合によっては、**テンプレート**をすべての環境ではなく、特定の環境だけで上書きしたい場合があります：

`service-name: template-file`

* `service-name`は、`docker-compose.yml`から上書きしたいサービスの名前です。
* `template-file`は、この環境でこのサービスに使用するテンプレートのパスと名前です。

#### テンプレート上書きの例 { #example-template-override }

```yaml title=".lagoon.yml"
environments:
  main:
    templates:
      mariadb: mariadb.main.deployment.yml
```

### `environments.[name].rollouts`

Lagoonのビルドプロセス `lagoon.rollout`ラベルを`docker-compose.yml`ファイルからチェックし、サービスが特別なロールアウトタイプを必要とするかどうかを確認します（`docker-compose.yml`の[ドキュメンテーション](docker-compose-yml.md#custom-rollout-monitor-types)で詳しく読むことができます）。

場合によっては、特に環境のテンプレートタイプを上書きした場合には、単一の環境だけで**ロールアウトタイプ**を上書きしたいことがあります。

`service-name: rollout-type`

* `service-name`は、上書きしたい`docker-compose.yml`のサービスの名前です。
* `rollout-type`は、ロールアウトのタイプです。可能な値については、`docker-compose.yml`の[ドキュメンテーション](docker-compose-yml.md#custom-rollout-monitor-types)を参照してください。

#### カスタムロールアウトタイプの例 { #custom-rollout-type-example }

```yaml title=".lagoon.yml"
environments:
  main:
    rollouts:
      mariadb: statefulset
```

### `environments.[name].autogenerateRoutes`

これにより、ルートの自動生成が無効になっている場合でも、任意の環境が自動生成されたルートを取得することができます。

```yaml title=".lagoon.yml"
routes:
  autogenerate:
    enabled: false
environments:
  develop:
    autogenerateRoutes: true
```

### `environments.[name].cronjobs`

<iframe width="560" height="315" src="https://www .youtube.com/embed/Yd_JfDyfbR0" title="YouTubeビデオプレーヤー" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

Cronジョブは、通常、すべての環境で同じものを実行することは望ましくないため、各環境で明示的に定義する必要があります。定義したスケジュールにより、CronジョブはKubernetesネイティブの`CronJob`として、または定義したサービスのcrontabを介したin-pod cronジョブとして実行される場合があります。

#### Cronジョブの例 { #cron-job-example}

```yaml title=".lagoon.yml"
cronjobs:
  - name: Hourly Drupal Cron
    schedule: "M * * * *" # 時間ごとに、ランダムな分に一度
    command: drush cron
    service: cli
  - name: Nightly Drupal Cron
    schedule: "M 0 * * *" # 日ごとに、00:00から00:59のランダムな分に一度
    command: drush cron
    service: cli
```

* `name`: 他のcronジョブと区別し、目的を特定するための任意の名前。
* `schedule`: cronジョブの実行スケジュール。Lagoonは、crontab形式の拡張版を使用します。構文がわからない場合は、[crontab generator](https://crontab.guru/)を使用してください。

  * 分に`M`を指定すると、cronジョブは ランダムな分（毎時間同じ分）に1時間ごとに実行するか、`M/15`を指定して15分ごとに実行するが、時間からのランダムなオフセット（`6,21,36,51`のような）で実行します。この機能を使用してcronジョブを分散させることは、すべてのジョブを分`0`で一斉に実行するよりも良い方法です。
* `H`を時間に指定すると、cronジョブはランダムな時間（毎日同じ時間）に1日1回実行されます。また、`H(2-4)`を指定すると、2時から4時の間に1日1回実行されます。

!!! Info "タイムゾーン："

    * cronジョブのデフォルトのタイムゾーンはUTCです。
    * ネイティブのcronジョブはノードのタイムゾーンを使用し、それはUTCです。
    * In-podのcronジョブは定義されたサービスのタイムゾーンを使用し、UTC以外に設定することができます。

* `command`：実行するコマンド。これはサービスの`WORKDIR`で実行されます。Lagoonイメージの場合、これは`/app`です。

!!! warning
      Cronジョブは、crontabを介してin-podで実行される可能性があり、それは[複数行のコマンドをサポートしていません](https://www.man7.org/linux/man-pages/man5/crontab.5.html)。複雑なまたは複数行のcronコマンドが必要な場合、コマンドとして使用できるスクリプトに入れる必要があります。[プレロールアウトまたはポストロールアウト タスク](#tasks) は機能します。

!!! 危険
      CronジョブはKubernetesのポッドで実行されますが、ポッドの再スケジューリングにより中断される可能性があります。
      そのため、cronジョブを作成する際には、次のcronインターバルでコマンドを安全に中断し、再実行できるようにする必要があります。

* `サービス`：コマンドをどのプロジェクトのサービスで実行するか。ほとんどのプロジェクトでは、これは`cli`サービスであるべきです。

## ポリサイト { polysite }

Lagoonでは、同じGitリポジトリが複数のプロジェクトに追加することができ、これをポリサイトと呼びます。これにより、同じコードベースを実行しながら、異なる独立したデータベースと永続的なファイルを許可することができます。 `.lagoon.yml`では、現在、ポリサイトプロジェクトのためのカスタムルートを指定することのみをサポートしています。標準プロジェクトとの主な違いは、`environments`が二次元要素となり、プロジェクト名が最上位要素となることです。

これを利用するには、以下の手順を踏む必要があります：

1. Lagoonに2つ（以上）のプロジェクトを作成し、それぞれに同じGit URLとプロダクションブランチを設定します。これは**あなたの.lagoon.ymlに従って命名されます**（例：`poly-project1` と `poly-project2`）
2. 各プロジェクトのデプロイキーをGitリポジトリに追加します。
3. リポジトリのウェブフックを設定します（もし 必要) - その後、プッシュ/デプロイが可能になります。リポジトリへのプッシュは、そのGit URLに対するすべてのプロジェクト/ブランチを同時にデプロイします。

### Polysiteの例 { polysite-example }

```yaml title=".lagoon.yml"
poly-project1:
  environments:
    main:
      routes:
        - nginx:
          - project1.com
poly-project2:
  environments:
    main:
      routes:
        - nginx:
          - project2.com
```

## 特別な項目 { #specials }

### `api`

???+ 情報
    amazee.ioのホストされたLagoonで直接動作する場合、このキーは設定する必要はありません。

キー`api`を使用すると、Lagoon CLIと`drush`がLagoon GraphQL APIに接続するために使用する別のURLを定義できます。これはスキーム付きの完全なURLである必要があります。例：`http://localhost:3000` これは通常変更する必要はありませんが、Lagoonの管理者がそうするよう指示する場合があります。

### `ssh`

???+ 情報
    amazee.ioのホストされたLagoonで直接動作する場合、このキーは設定する必要はありません。

キー`ssh`を使用すると、Lagoon CLIと`drush`がLagoonリモートシェルサービスに接続するために使用する別のSSHエンドポイントを定義できます。これはコロンで区切られたホスト名とポートである必要があります。例：`localhost:2020` これは通常変更する必要はありませんが、Lagoonの管理者がそうするよう指示する場合があります。 変更する必要はありませんが、Lagoonの管理者がそうするように指示する場合があります。

### `container-registries`

`container-registries` ブロックでは、カスタムまたはプライベートなイメージをプルするための独自のプライベートコンテナレジストリを定義することができます。プライベートコンテナレジストリを使用するには、`username`、`password`、およびオプションでレジストリの `url` が必要です。YAMLで `url` を指定しない場合、デフォルトでDocker Hubを使用します。

レジストリユーザーのためのパスワードを定義する方法は2つあります。

Lagoon APIで `container_registry` タイプの環境変数を作成します：

* `lagoon add variable -p <project_name> -N <registry_password_variable_name> -V <password_goes_here> -S container_registry`
* \(詳しくは [Environment Variables](../concepts-advanced/environment-variables.md) を参照してください\)

作成した変数の名前は、パスワードとして設定することができます：

```yaml title=".lagoon.yml"
container-registries:
  my-custom-registry:
    username: myownregistryuser
    password: <registry_password_variable_name>
    url: my.own.registry.com
```

また、`.lagoon.yml` ファイルに直接プレーンテキストでパスワードを定義することもできます：

```yaml title=".lagoon .yml"
container-registries:
  docker-hub:
    username: dockerhubuser
    password: MySecretPassword
```

### カスタムまたはプライベートなコンテナレジストリイメージの使用 { #consuming-a-custom-or-private-container-registry-image }

カスタムまたはプライベートなコンテナレジストリイメージを使用するには、`docker-compose.yml` ファイル内のサービスを更新して、イメージを定義する代わりにビルドコンテキストを使用するようにする必要があります：

```yaml title=".docker-compose.yml"
services:
  mariadb:
    build:
      context: .
      dockerfile: Dockerfile.mariadb
```

`docker-compose.yml` ファイルがビルドを使用するように更新されたら、 `Dockerfile.<service>` を作成し、プライベートイメージを `FROM <repo>/<name>:<tag>` として設定する必要があります。

```yaml title=".lagoon.yml"
FROM dockerhubuser/my-private-database:tag
```

## `.lagoon.yml` の例 { #example-lagoonyml }

これは全ての可能な設定を示す `.lagoon.yml` の例です。プロジェクトに合わせて調整する必要があります。

```yaml linenums="1" title=".lagoon.yml"
docker-compose-yaml: docker-compose.yml

environment_variables:
  git_sha: 'true'

tasks:
  pre-rollout:
    - run:
        name: drush sql-dump
        command: mkdir -p /app/web/sites/default/files/private/ && drush sql-dump --ordered-dump --gzip --result-file=/app/web/sites/default /files/private/pre-deploy-dump.sql.gz
        サービス: cli
  post-rollout:
    - 実行:
        名前: drush cim
        コマンド: drush -y cim
        サービス: cli
        シェル: bash
    - 実行:
        名前: drush cr
        コマンド: drush -y cr
        サービス: cli

routes:
  autogenerate:
    insecure: リダイレクト

environments:
  main:
    routes:
      - nginx:
        - example.com
        - example.net
        - "www.example.com":
            tls-acme: true
            insecure: リダイレクト
            hstsEnabled: true
        - "example.ch":
            annotations:
              nginx.ingress.kubernetes.io/permanent-redirect: https://www.example.ch$request_uri
        - www.example.ch
    types:
      mariadb: mariadb
    templates:
      mariadb: mariadb.main.deployment.yml
    rollouts:
      mariadb: statefulset
    cronjobs:
      - 名前: drush cron
        スケジュール: "M * * * *" # これは1時間ごとにcronを実行します。
        コマンド: drush cron
        サービス: cli
  staging:
      cronjobs:
      - 名前: drush cron
        スケジュール: "M * * * *" # これは1時間ごとにcronを実行します。
        コマンド: drush cron
        サービス: cli
  feature/feature-branch:
      cronjobs: - 名前: drush cron
        スケジュール: "H * * * *" # これは毎時一度cronを実行します。
        コマンド: drush cron
        サービス: cli
```

## 非推奨

これらの設定は非推奨となり、あなたの `.lagoon.yml` から削除するべきです。

* `routes.autogenerate.insecure`

    `None` オプションは `Redirect` と同等です。

* `environments.[name].monitoring_urls`
* `environments.[name].routes.[service].[route].hsts`
* `environments.[name].routes.[service].[route].insecure`

    `None` オプションは `Redirect` と同等です。
