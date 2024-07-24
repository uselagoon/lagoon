# .lagoon.yml

`.lagoon.yml` ファイルは、プロジェクトを設定するための中心となるファイルです。以下の操作を行うための設定が含まれています:

* [サイトへのアクセスルートを定義する](lagoon-yml.md#routes)
* [プリロールアウトタスクを定義する](#pre-rollout-tasks-pre_rolloutirun)
* [ポストロールアウトタスクを定義する](#post-rollout-tasks-post_rolloutirun)
* [SSL証明書を設定する](#ssl-configuration-tls-acme)
* [環境のためのcronジョブを追加する](#environmentsnamecronjobs)

`.lagoon.yml` ファイルは、Gitリポジトリのルートに配置する必要があります。

## 汎用的な設定

### `docker-compose-yaml`

この設定は、ビルドスクリプトにどのDocker Compose YAMLファイルを使用するべきかを指示します。これにより、どのサービスとコンテナがデプロイされるべきかを把握します。デフォルトとして `docker-compose.yml` を指しますが、必要に応じて特定のLagoon Docker Compose YAMLファイルを使用することもできます。

### `environment_variables.git_sha`

この設定は、デプロイされたGit SHAを環境変数としてプロジェクトに設定することを有効にします。デフォルトではこれは無効です。値を `true` に設定すると、SHAが環境変数 `LAGOON_GIT_SHA` として設定されます。

## ルート { #routes }

ルートはトラフィックをサービスへ転送するために使用されます 。環境内の各サービスにはルートがあり、ドメイン名は手動または自動で定義されます。トップレベルの `routes` セクションの設定は、すべての環境のすべてのルートに対して適用されます。

### `routes.autogenerate`

ルートを自動的に作成するよう設定できます。[手動ルート](#environmentsnameroutes)は環境ごとに定義されます。

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

## タスク

定義可能なタスクには複数の種類があり、それらはビルドフローの中のどのタイミングで実行されるかが異なります。

### プリロールアウトタスク - `pre_rollout.[i].run` { #pre-rollout-tasks-pre_rolloutirun}

すべてのイメージが正常にビルドされた後、かつ、以下のタイミングの前に、プロジェクトに対して実行するタスクを指定することができます。

* 新規にビルドされたイメージで実行中のコンテナが更新される
* 既存の環境に他の変更が加えられる

この機能を利用すると、たとえば、アプリケーションを更新する前にデータベースダンプを作成するなどが可能になります。この機能は、デプロイに問題が発生した場合のロールバックを容易にします。

!!! Info "情報"
    プリロールアウトタスクは、更新前の既存のポッド内で実行されます。つまり:

    * 最後のデプロイ以降にDockerfileに加えられた変更は、プリロールアウトタスクが実行されるときには反映されません。
    * 既存のコンテナがない場合(例えば、新しい環境の初期デプロイメント時など)、プリロールアウトタスクはスキップされます。

### ポストロールアウトタスク - `post_rollout.[i].run` { #post-rollout-tasks-post_rolloutirun }

以下のタイミングの後にプロジェクトに対して実行する必要があるタスクを指定することができます。

* 全てのイメージが正常にビルドされる
* 全てのコンテナが新しいイメージで更新される
* `readiness`チェックを通過し、全てのコンテナが稼働する

ポストロールアウトタスクの一般的な使用例には、`drush updb`、`drush cim`の実行や、さまざまなキャッシュのクリアなどが含まれます。

* `name`
  * 名前は、ログ内の各タスクを識別するための任意のラベルです。
* `command`
  * ここでは、実行するべきコマンドを指定します。これらは、各コンテナのWORKDIRで実行されます。Lagoonのイメージの場合、これは`/app`です。タスクを実行するために特定の場所に`cd`する必要がある場合は、これを念頭に置いてください。
* `service`
  * タスクを実行するサービスを指定します。Drupalの例に従っている場合、これはCLIコンテナになります。なぜなら、あなたのサイトのコード、ファイル、データベースへの接続がすべて含まれているからです。通常、これを変更する必要はありません。
* `container`
  * サービスが複数のコンテナを持っている場合(例:`nginx-php`)、ポッド内で接続するコンテナを指定する必要があります(例:`nginx`ポッド内の`php`コンテナ)。
* `shell`
  * タスクを実行するシェルを指定します。デフォルトでは`sh`が使用されますが、コンテナが他のシェル(`bash`など)を持っている場合は`sh`以外のシェルを指定できます。これは、ポストロールアウト内でif/elseを使った小さなbashスクリプトを実行したい場合に便利です。複数行にわたるスクリプトを記述する方法を学ぶには[以下の例](#example-post-rollout-tasks)を参照してください。
* `when`
  * タスクの条件付き実行を可能にします。タスクを実行するか決定するために、true/falseに評価される式であることを期待されます。

注: デプロイメント中にpre/post-rolloutタスクを一時的に無効にしたい場合は、APIで以下の環境変数をプロジェクトレベルまたは環境に設定します（[環境変数](../concepts-advanced/environment-variables.md)の設定方法についてはここを参照してください）。

* `LAGOON_PREROLLOUT_DISABLED=true`
* `LAGOON_POSTROLLOUT_DISABLED=true`

#### post-rolloutタスクの例

以下はいくつかの有用なpost-rolloutタスクの例です。

Drupalがインストールされていない場合にのみ実行するタスク:

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

ブランチ名に基づいて実行するタスク:

```yaml title=".lagoon.yml"
- run:
    name: Different tasks based on branch name
    command: |
        ### Runs if current branch is not 'production'
    service: cli
    when: LAGOON_GIT_BRANCH != "production"
```

シェルスクリプトを実行:

```yaml title=".lagoon.yml"
- run:
    name: Run Script
    command: './scripts/script.sh'
    service: cli
```

ポッド内の特定のコンテナを対象にする:

```yaml title=".lagoon.yml"
- run:
    name: show php env variables
    command: env
    service: nginx
    container: php
```

Drupal & Drush 9: マスター環境からデータベースとファイルを同期:

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

## バックアップの保持期間

### `backup-retention.production.monthly`

プロジェクトのproduction環境の月次バックアップの保持数を指定します。

この値が指定されていない場合、デフォルトは `1` です。

### `backup-retention.production.weekly`

プロジェクトのproduction環境の週次バックアップの保持数を指定します。

この値が指定されていない場合、デフォルトは `6` です。

### `backup-retention.production.daily`

プロジェクトのproduction環境の日次バックアップの保持数を指定します。

この値が指定されていない場合、デフォルトは `7` です。

### `backup-retention.production.hourly`

プロジェクトのproduction環境の毎時バックアップの保持数を指定します。

この値が指定されていない場合、デフォルトは `0` です。

## バックアップスケジュール

### `backup-schedule.production`

プロジェクトのバックアップスケジュールを指定します。ただし、`Minute` ブロックは `M` でなければならず、他の値は Lagoon ビルドに失敗します。これにより、Lagoonはこれらのバックアップを何分に行うかランダムに選択することができ、ユーザーはスケジュールの残りの部分を時間単位で指定できます。

この値が指定されていない場合、グローバルデフォルトは `M H(22-2) * * *` です。注意して頂きたいのは、 これらのバックアップは、クラスタのローカルタイムゾーンを使用します。

## 環境

環境名は、デプロイされたブランチ名やプルリクエスト名と一致します。これにより、各環境で異なる設定を持つことが可能になります。私たちの例では、`main`と`staging`環境に適用されます。

### `environments.[name].routes`

<iframe width="560" height="315" src="https://www.youtube.com/embed/vQxh87F3fW4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

手動ルートは、サービスへのトラフィックを指示するために環境ごとに設定されたドメイン名です。すべての環境がデフォルトで[自動生成されたルート](#routesautogenerate)を取得するため、手動ルートは通常、プロジェクトのウェブサイトのメインドメイン(`www.example.com`など)を使用して本番環境でのみ設定されます。

!!! Tip "ヒント"
    Lagoonは手動ルートを制御できないので、DNSプロバイダーでDNSレコードが適切に設定されていることを確認する必要があります。自動ルートを指す`CNAME`レコードを設定できる可能性があります。

環境の次の最初の要素はターゲットサービスであり、私たちの例では`nginx`となっています。 これは私たちがどのサービスに入ってくるリクエストを送るかを識別する方法です。

最も単純なルートは `example.com`で、これは私たちの例の[`.lagoon.yml`](#example-lagoonyml)で確認  できます - 追加の設定がないことがわかります。これは、あなたがルートに対してLet's Encrypt証明書を望んでいると仮定し、HTTPSからHTTPへのリダイレクトはありません。

以下の`"www.example.com"`の例では、さらに3つのオプションを見ることができます(また、ルートの終わりにある`:`と、ルートが`"`で囲まれていることに注意してください、これは重要です！):

```yaml title=".lagoon.yml"
- "www.example.com":
    tls-acme: true
    insecure: Redirect
    hstsEnabled: true
```

### SSL設定 `tls-acme` { #ssl-configuration-tls-acme }

!!! Warning "警告"
    `tls-acme: true`から`tls-acme: false`に切り替えると、このルートに対して以前に生成された証明書がすべて削除されます。これは、外部のCDNを使用していて証明書のピン留めを行っている場合、予期しない挙動を引き起こす可能性があります。

* `tls-acme`:Let's Encryptを通じた自動TLS証明書生成を設定します。デフォルトは`true`で、自動証明書を無効にするには`false`に設定します。
* `insecure`:HTTP接続を設定します。デフォルトは`Allow`です。
  * `Allow`:ルートはHTTPとHTTPSに応答します。
  * `Redirect`:ルートはすべてのHTTPリクエストをHTTPSにリダイレクトします。
* `hstsEnabled`: `Strict-Transport-Security`ヘッダーを追加します。デフォルトは
  `false`です。
* `hstsMaxAge`: `max-age`ディレクティブを設定します。デフォルトは `31536000` (1
  年)です。
* `hstsPreload`: `preload`ディレクティブを設定します。デフォルトは `false`です。
* `hstsIncludeSubdomains`: `includeSubDomains`ディレクティブを設定します。デフォルトは
  `false`です。

!!! Info "情報"
    証明書認証機関(CA)によって署名されたSSL証明書からLet's Encrypt証明書に切り替える予定の場合、移行を監視するためにLagoon管理者に連絡することをお勧めします。

### 特定のパスの監視

[UptimeRobot](https://uptimerobot.com/)があなたのクラスター(KubernetesまたはOpenShift)に設定されている場合、Lagoonは各ルート/イングレスにannotationを設定して`stakater/IngressControllerMonitor`を使用します。デフォルトのアクションはルートのホームページを監視することです。特定のルートを監視したい場合、ルート仕様に`monitoring-path`を追加することでこれをオーバーライドできます。一般的な使用法は、キャッシングをバイパスする監視用のパスを設定し、サイトのリアルタイムの監視を可能にすることです。

```yaml title=".lagoon.yml"
- "www.example.com":
      monitoring-path: "/bypass-cache"
```

### Ingress annotations

!!! Warning "警告"
    ルート/Ingressのannotationsは、nginx-ingressコントローラーを実行するクラスターにデプロイされるプロジェクトのみがサポートしています。これがサポートされているかどうかはLagoon管理者に確認してください。

* `annotations`は、[nginx-ingressコントローラーがサポートするannotations](https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/)のYAMLマップです。これは特に、簡単なリダイレクトや他の設定に便利です。

#### 制限事項

Lagoonでは、一部のannotationsが禁止されているか、または部分的に制限されています。
以下の表は、これらのルールを説明しています。

あなたの`.lagoon.yml`がこれらのannotationsのいずれかを含んでいる場合、ビルドが失敗する原因となります。

| 注釈                                             | ノート                                                                                    |
| ---                                               | ---                                                                                        |
| `nginx.ingress.kubernetes.io/auth-snippet`          | 禁止                                                                               |
| `nginx.ingress.kubernetes.io/configuration-snippet` | `rewrite`、`add_header`、`set_real_ip`、および `more_set_headers` ディレクティブに制限されています。 |
| `nginx.ingress.kubernetes.io/modsecurity-snippet`   | 禁止                                                                               |
| `nginx.ingress.kubernetes.io/server-snippet`        | `rewrite`、`add_header`、`set_real_ip`、および `more_set_headers` ディレクティブに制限されています。 |
| `nginx.ingress.kubernetes.io/stream-snippet`        | 禁止                                                                               |
| `nginx.ingress.kubernetes.io/use-regex`             | 禁止                                                                               |

#### Ingressのannotationsリダイレクト

この例では、`example.ch`への任意のリクエストが、フォルダーやクエリパラメータを保持したまま `https://www.example.ch`にリダイレクトされます(`example.com/folder?query` -&gt; `https://www.example.ch/folder?query`)。

```yaml title=".lagoon.yml"
- "example.ch":
    annotations:
      nginx.ingress.kubernetes.io/permanent-redirect: https://www.example.ch$request_uri
- www.example.ch
```

Lagoonにホストされていない他の任意のURLにリダイレクトすることも可能です。 以下は`example.de`へのリクエストを`https://www.google.com`にリダイレクトします。

```yaml title=".lagoon.yml"
- "example.de":
    annotations:
      nginx.ingress.kubernetes.io/permanent-redirect: https://www.google.com
```

#### 信頼されるリバースプロキシ

!!! Warning "警告"
    Kubernetesは単一の`nginx.ingress.kubernetes.io/server-snippet`アノテーションのみを処理します。非本番環境のルートでこのアノテーションを使用する場合は、`add_header X-Robots-Tag "noindex, nofollow";`アノテーションもサーバースニペットの一部として含めてください。これは、開発環境でロボットがクロールするのを防ぐために必要です。ingressテンプレートの開発環境でこれを防ぐために設定されたデフォルトのserver-snippetは、`.lagoon.yml`に設定された`server-snippets`によって上書きされます。

一部の設定では、リバースプロキシ(CDNなど)がKubernetesクラスタの前に配置されます。これらの設定では、リバースプロキシのIPがアプリケーションの`REMOTE_ADDR` `HTTP_X_REAL_IP` `HTTP_X_FORWARDED_FOR`ヘッダーフィールドとして表示されます。リクエスターのオリジナルIPは`HTTP_X_ORIGINAL_FORWARDED_FOR`ヘッダーで確認できます。

あなたのアプリケーションがオリジナルのリクエストIPを必要とする場合、 `REMOTE_ADDR` `HTTP_X_FORWARDED_FOR` `HTTP_X_REAL_IP` ヘッダーに元のIPが表示されるようにするには、信頼するリバースプロキシのIPをイングレスに伝える必要があります:

```yaml title=".lagoon.yml"
- "example.ch":
    annotations:
      nginx.ingress.kubernetes.io/server-snippet: |
        set_real_ip_from 1.2.3.4/32;
```

この例では、CIDR `1.2.3.4/32`(この場合はIP `1.2.3.4`)を信頼します。したがって、IP `1.2.3.4` からKubernetesクラスターにリクエストが送信されると、`X-Forwarded-For` ヘッダーが分析され、その内容が `REMOTE_ADDR` `HTTP_X_REAL_IP` `HTTP_X_FORWARDED_FOR` ヘッダーに設定されます。

### `Environments.[name].types`

Lagoonのビルドプロセスは、`docker-compose.yml`ファイルから`lagoon.type`ラベルを調べて、どの種類のサービスがデプロイされるべきかを学習します([`docker-compose.yml`](docker-compose-yml.md#types)のドキュメンテーションで詳しく読むことができます)。

場合によっては、全環境ではなく、単一の環境だけで**type**をオーバーライドしたいことがあります。もし、サービスブローカー/オペレーターに共有データベースをプロビジョニングさせるのではなく、開発環境でスタンドアロンのMariaDBデータベースが必要な場合は、以下の手順に従ってください。

`service-name: service-type`

* `service-name`は、`docker-compose.yml`から上書きしたいサービスの名前です
* `service-type`は、上書きたいサービスタイプです

MariaDB\_Galeraの設定例:

```yaml title=".lagoon.yml"
environments:
  develop:
    types:
      mariadb: mariadb-single
```

### `environments.[name].templates`

Lagoonのビルドプロセスは、`docker-compose.yml`ファイルから`lagoon.template`ラベルを調べて、サービスがカスタムテンプレートファイルを必要とするかどうかを確認します([`docker-compose.yml`](docker-compose-yml.md)のドキュメンテーションで詳しく読むことができます)。

場合によっては、**テンプレート**をすべての環境ではなく、特定の環境だけで上書きしたい場合があります:

`service-name: template-file`

* `service-name`は、`docker-compose.yml`から上書きしたいサービスの名前です。
* `template-file`は、この環境でこのサービスに使用するテンプレートのパスと名前です。

#### テンプレート上書きの例

```yaml title=".lagoon.yml"
environments:
  main:
    templates:
      mariadb: mariadb.main.deployment.yml
```

### `environments.[name].rollouts`

Lagoonのビルドプロセス `lagoon.rollout`ラベルを`docker-compose.yml`ファイルから調べて、サービスが特別なロールアウトタイプを必要とするかどうかを確認します(`docker-compose.yml`の[ドキュメンテーション](docker-compose-yml.md#custom-rollout-monitor-types)で詳しく読むことができます)。

場合によっては、特に環境のテンプレートタイプを上書きした場合には、単一の環境だけで**ロールアウトタイプ**を上書きしたいことがあります。

`service-name: rollout-type`

* `service-name`は、上書きしたい`docker-compose.yml`のサービスの名前です。
* `rollout-type`は、ロールアウトのタイプです。可能な値については、`docker-compose.yml`の[ドキュメンテーション](docker-compose-yml.md#custom-rollout-monitor-types)を参照してください。

#### カスタムロールアウトタイプの例

```yaml title=".lagoon.yml"
environments:
  main:
    rollouts:
      mariadb: statefulset
```

### `environments.[name].autogenerateRoutes`

ルートの自動生成が無効になっている場合でも、環境ごとに自動生成ルートを設定することができます。

```yaml title=".lagoon.yml"
routes:
  autogenerate:
    enabled: false
environments:
  develop:
    autogenerateRoutes: true
```

### `environments.[name].cronjobs` { #environmentsnamecronjobs }

<iframe width="560" height="315" src="https://www.youtube.com/embed/Yd_JfDyfbR0" title="YouTubeビデオプレーヤー" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

Cronジョブは、通常、すべての環境で同じものを実行することは望ましくないため、各環境で明示的に定義する必要があります。定義したスケジュールにより、CronジョブはKubernetesネイティブの`CronJob`として、または定義したサービスのcrontabを介したin-pod cronジョブとして実行される場合があります。

#### Cronジョブの例

```yaml title=".lagoon.yml"
cronjobs:
  - name: Hourly Drupal Cron
    schedule: "M * * * *" # 1時間ごと, 何分なのかはランダム.
    command: drush cron
    service: cli
  - name: Nightly Drupal Cron
    schedule: "M 0 * * *" # 1日ごと, 何分なのかは、00:00から00:59の間のランダム.
    command: drush cron
    service: cli
```

* `name`: 他のcronジョブと区別し、目的を特定するための任意の名前
* `schedule`: cronジョブの実行スケジュール。Lagoonは、crontab形式の拡張版を使用します。構文がわからない場合は、[crontab generator](https://crontab.guru/)を使用してください。

  * 分に`M`を指定すると、cronジョブは ランダムな分(毎時間同じ分)に1時間ごとに実行するか、`M/15`を指定して15分ごとに実行するが、時間からのランダムなオフセット(`6,21,36,51`のような)で実行します。この機能を使用してcronジョブを分散させることは、すべてのジョブを分`0`で一斉に実行するよりも良い方法です。
* `H`を時間に指定すると、cronジョブはランダムな時間(毎日同じ時間)に1日1回実行されます。また、`H(2-4)`を指定すると、2時から4時の間に1日1回実行されます。

!!! Info "タイムゾーン:"

    * cronジョブのデフォルトのタイムゾーンはUTCです。
    * ネイティブのcronジョブはノードのタイムゾーンを使用し、それはUTCです。
    * In-podのcronジョブは定義されたサービスのタイムゾーンを使用し、UTC以外に設定することができます。

* `command`:実行するコマンドを指定します。これはサービスの`WORKDIR`で実行されます。Lagoonイメージの場合、これは`/app`です。

!!! Warning "警告"
      Cronジョブは、crontabを介してPod内で実行される可能性があり、[複数行のコマンドをサポートしていません](https://www.man7.org/linux/man-pages/man5/crontab.5.html)。複雑なまたは複数行のcronコマンドが必要な場合、コマンドとして使用可能なスクリプトを用意する必要があります。[プリロールアウトまたはポストロールアウト タスク](#tasks) が機能するかどうか検討してください。

!!! Danger "危険"
      CronジョブはKubernetesのポッドで実行されますが、ポッドの再スケジューリングにより中断される可能性があります。
      そのため、cronジョブを作成する際には、次のcronインターバルでコマンドを安全に中断し、再実行できるようにする必要があります。

* `service`:コマンドをプロジェクトのどのサービスで実行するかを指定します。ほとんどのプロジェクトでは、これは`cli`サービスであるべきです。

## ポリサイト

Lagoonでは、同じGitリポジトリを複数のプロジェクトに追加することができ、これをポリサイトと呼びます。これにより、同じコードベースを実行しながら、異なる独立したデータベースと永続的なファイルを許可することができます。 `.lagoon.yml`では、現在、ポリサイトプロジェクトのためのカスタムルートを指定することのみをサポートしています。標準プロジェクトとの主な違いは、`environments`が二次元要素となり、プロジェクト名が最上位要素となることです。

これを利用するには、以下の手順を踏む必要があります:

1. Lagoonに2つ(以上)のプロジェクトを作成し、それぞれに同じGit URLとプロダクションブランチを設定します。これは**あなたの.lagoon.ymlに従って命名されます**(例:`poly-project1` と `poly-project2`)
2. 各プロジェクトのデプロイキーをGitリポジトリに追加します。
3. (もし必要なら)リポジトリのウェブフックを設定します - その後、プッシュ/デプロイが可能になります。リポジトリへのプッシュは、そのGit URLに対するすべてのプロジェクト/ブランチを同時にデプロイします。

### Polysiteの例

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

## 特別な項目

### `api`

???+ 情報
    amazee.ioにホストされたLagoonで直接動作する場合、このキーは設定する必要はありません。

`api`キーを使用すると、Lagoon CLIと`drush`がLagoon GraphQL APIに接続するために使用する別のURLを定義できます。これはスキーム付きの完全なURLである必要があります。例:`http://localhost:3000` これは通常変更する必要はありませんが、Lagoonの管理者がそうするよう指示する場合があります。

### `ssh`

???+ 情報
    amazee.ioにホストされたLagoonで直接動作する場合、このキーは設定する必要はありません。

`ssh`キーを使用すると、Lagoon CLIと`drush`がLagoonリモートシェルサービスに接続するために使用する別のSSHエンドポイントを定義できます。これはコロンで区切られたホスト名とポートである必要があります。例:`localhost:2020` これは通常変更する必要はありませんが、Lagoonの管理者がそうするよう指示する場合があります。

### `container-registries`

`container-registries` ブロックでは、カスタムまたはプライベートなイメージをプルするための独自のプライベートコンテナレジストリを定義することができます。

プライベートコンテナレジストリを使用するには、`username`、`password`、およびオプションでレジストリの `url` が必要です。YAMLで `url` を指定しない場合、デフォルトでDocker Hubを使用します。また、コンテナレジストリエントリに説明を追加して、情報を提供することをお勧めします。いくつかの例を以下に示します

レジストリユーザーに使用するユーザー名とパスワードを定義する方法は2つあります。

* APIで環境変数として定義する
* .lagoon.ymlファイルにハードコードする（ただし、これは推奨しません）

#### 環境変数として定義する方法

まず、.lagoon.ymlにコンテナレジストリを定義します。ここではユーザー名やパスワードを定義する必要はありません。カスタムレジストリを使用する場合でも、URLを指定する必要があります。例えば次のように定義します:

```yaml title=".lagoon.yml"
container-registries:
  docker-hub:
    description: "デフォルトのdocker.ioレジストリ用のユーザー名とパスワードは環境変数から取得されます"
  my-custom-registry:
    description: "カスタムレジストリ用のユーザー名とパスワードは環境変数から取得されます"
    url: my.own.registry.com
  another-custom-registry:
    description: "他のレジストリ用のユーザー名とパスワードは環境変数から取得されます"
    username: myotheruser
    url: my.other.registry.com
```

.lagoon.ymlにユーザー名を定義する場合、関連する変数を追加する必要はありません。ただし、変数を追加する場合、その変数の値が優先されます。

次に、Lagoon APIで`container_registry`タイプの環境変数を作成します。

* lagoon add variable -p <プロジェクト名> -N <レジストリユーザーの変数名> -V <ユーザー> -S container_registry
* lagoon add variable -p <プロジェクト名> -N <レジストリパスワードの変数名> -V <パスワード> -S container_registry
* \(詳しくは[環境変数](/concepts-advanced/environment-variables/)を参照\)

変数の名前は.lagoon.ymlファイルで定義されたレジストリの名前と一致する必要があります。次のように設定してください：

* 大文字で記述する
* ハイフン（-）をアンダースコア（_）に置き換える
* プレフィックスにREGISTRY_を付ける
* サフィックスに_USERNAMEまたは_PASSWORDを付ける

いくつかの例を示します：

* `dockerhub`は`REGISTRY_DOCKERHUB_USERNAME`および`REGISTRY_DOCKERHUB_PASSWORD`になります。
* `docker-hub`は`REGISTRY_DOCKER_HUB_USERNAME`および`REGISTRY_DOCKER_HUB_PASSWORD`になります。
* `my-custom-registry`は`REGISTRY_MY_CUSTOM_REGISTRY_USERNAME`および`REGISTRY_MY_CUSTOM_REGISTRY_PASSWORD`になります。
* ハイフンが含まれていない場合、小文字のバージョン（例：`REGISTRY_dockerhub_USERNAME`）も動作することがありますが、常に大文字のバージョンが優先されます。


???+ "Legacy method of defining registry password"
    以前は、環境変数を使用してパスワードを定義する方法がありました。この場合、変数名は`.lagoon.yml`ファイルで次のように定義されます：
    ```yaml title=".lagoon.yml"
    container-registries:
      docker-hub:
        username: dockerhubuser
        password: MY_DOCKER_HUB_PASSWORD
    ```
    > ユーザー名もこのファイルに提供する必要がありますが、サポートされている変数でユーザー名を定義する場合はその限りではありません。

    変数は次のようにAPIに追加できます：

    * lagoon add variable -p <プロジェクト名> -N MY_DOCKER_HUB_PASSWORD -V <パスワード> -S container_registry

    この方法は引き続きサポートされますが、将来的に非推奨となる可能性があります。ユーザーがサポートされている方法に変更する時間を確保するために、ビルド内で警告が表示されるようにします。

    サポートされているパスワードの変数が提供されている場合、カスタム名の変数の代わりにそれが使用されます。

#### ハードコードされた値の方法

推奨されませんが、`.lagoon.yml` ファイルに直接プレーンテキストとしてパスワードを定義することもできます:

```yaml title=".lagoon.yml"
container-registries:
  docker-hub:
    description: "デフォルトのdocker.ioレジストリの認証情報"
    username: dockerhubuser
    password: MySecretPassword
  my-custom-registry:
    description: "自分のレジストリの認証情報"
    url: my.own.registry.com
    username: mycustomuser
    password: MyCustomSecretPassword
```

### カスタムまたはプライベートなコンテナレジストリイメージの使用

カスタムまたはプライベートなコンテナレジストリイメージを使用するには、`docker-compose.yml` ファイル内のサービスを更新して、イメージを定義する代わりにビルドコンテキストを使用するようにする必要があります:

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

## `.lagoon.yml` の例

これは全ての可能な設定を示した `.lagoon.yml` の例です。プロジェクトに合わせて調整する必要があります。

```yaml linenums="1" title=".lagoon.yml"
docker-compose-yaml: docker-compose.yml

environment_variables:
  git_sha: 'true'

tasks:
  pre-rollout:
    - run:
        name: drush sql-dump
        command: mkdir -p /app/web/sites/default/files/private/ && drush sql-dump --ordered-dump --gzip --result-file=/app/web/sites/default/files/private/pre-deploy-dump.sql.gz
        service: cli
  post-rollout:
    - run:
        name: drush cim
        command: drush -y cim
        service: cli
        shell: bash
    - run:
        name: drush cr
        command: drush -y cr
        service: cli

routes:
  autogenerate:
    insecure: Redirect

environments:
  main:
    routes:
      - nginx:
        - example.com
        - example.net
        - "www.example.com":
            tls-acme: true
            insecure: Redirect
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
      - name: drush cron
        schedule: "M * * * *" # This will run the cron once per hour.
        command: drush cron
        service: cli
  staging:
      cronjobs:
      - name: drush cron
        schedule: "M * * * *" # This will run the cron once per hour.
        command: drush cron
        service: cli
  feature/feature-branch:
      cronjobs:
      - name: drush cron
        schedule: "H * * * *" # This will run the cron once per hour.
        command: drush cron
        service: cli
```

## 非推奨

これらの設定は非推奨となり、あなたの `.lagoon.yml` から削除するべきです。

* `routes.autogenerate.insecure`

    `None` オプションは `Redirect` と同等です。

* `environments.[name].monitoring_urls`
* `environments.[name].routes.[service].[route].hsts`
* `environments.[name].routes.[service].[route].insecure`

    `None` オプションは `Redirect` と同等です。
