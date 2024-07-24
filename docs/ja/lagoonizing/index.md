# 既存のサイトをLagoonizing

「Lagoonizing」とは、既存のサイトをLagoonプラットフォームに適応させることで、通常は難しくない作業です（ただし、サイトやセットアップにより異なります）。「Lagoonizing」にはいくつかの手順が必要となります。このプロセスを簡単にするためのステップバイステップのガイドをまとめています。

## 要件

あなたのシステムがローカルでLagoonを使用するための[要件を満たしている](../using-lagoon-the-basics/index.md)ことを確認してください。

## ローカル開発環境

ローカルでの開発環境の設定方法については[こちら](../using-lagoon-the-basics/local-development-environments.md)をご覧ください。PygmyまたはLandoのいずれかを使用することができます。

## コマンドラインとGit

Lagoonとのやり取りにはコマンドラインが必要ですし、Gitも使用しますので、これらが準備できているか確認してください。

### コマンドライン

タスクの実行にはコマンドラインを使用する必要があります。OSのデフォルトのツールを含め、何を使用していただいても構いません。以下にいくつかのオプションを示します:

- [iTerm2](https://iterm2.com/) (Mac)
- [PowerShell](https://docs.microsoft.com/en-us/powershell/) (Windows)
- [Fish](https://fishshell.com/) (Mac, Windows, Linux)
- [Tabby](https://tabby.sh/) (Mac, Windows, Linux)

### Gitのインストール

まだGitをインストールしていない場合は、 何らかの形でGitクライアントが必要となります。コマンドライン、GUI、何でも構いません(私たちの例では、コマンドラインを使用します)。以下にいくつかのオプションを示します:

- [Gitのインストール](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) (Mac、Windows、Linux)
- [SourceTree](https://www.sourcetreeapp.com/) (Mac、Windows)
- [GitHub Desktop](https://desktop.github.com/) (Mac、Windows)
- [GitKraken](https://www.gitkraken.com/git-client) (Mac、Windows、Linux - 公開リポジトリは無料)

## Lagoon管理者が必要とするもの

Lagoonを設定するLagoon管理者は、各種情報が必要となります。[詳細はこちら](../using-lagoon-the-basics/setup-project.md)。

## Webhooksの設定

次に、Gitリポジトリのためのwebhooksを設定する必要があります。その手順は[こちら](../using-lagoon-the-basics/configure-webhooks.md)からご確認いただけます。

## `docker-compose.yml`

`docker-compose.yml`ファイルは、Lagoonにおいて以下の目的で使用されます:

- どのサービス/コンテナをデプロイするべきかを学ぶ。
- コンテナのイメージがどのようにビルドされるかを定義する。
- 永続ボリュームなどの追加設定を定義する。

さらに詳しい情報は[`docker-compose.yml`ドキュメンテーション](../concepts-basics/docker-compose-yml.md)をご確認ください.

`docker-compose.yml`ファイルは、あなたのサイトをLagoonに対応させるために作成・設定する2つのファイルのうちの1つです。

`Docker-compose`(ツール)は、YAMLファイルの内容を厳格に検証するので、サービス定義の**ラベル**内でのみ設定を行うことができます。

!!! Warning "警告"

    Lagoonは`docker-compose.yml`ファイルからラベル、サービス名、イメージ名、ビルド定義のみを読み込みます。ポート、環境変数、ボリューム、ネットワーク、リンク、ユーザーなどの定義は無視されます。これは意図的なもので、`docker-compose`ファイルはあなたのローカル環境設定を定義するためのものです。Lagoonは`lagoon.type`からあなたがデプロイしているサービスのタイプを学び、その結果、このサービスが必要とする可能性のあるポート、ネットワーク、その他の追加設定について知ることができます。

基本的なサービスの設定方法をいくつか見てみましょう。この例では、Drupal、Laravel、その他のコンテンツマネジメントシステムなど、多くのシステムに必要なNGINX、PHP、MariaDBを設定します。

以下は、Drupal用の`docker-compose.yml`ファイルの例です:

```yaml title="docker-compose.yml"
version: '2.3'

x-lagoon-project:
  # Lagoonプロジェクト名（ここを編集する場合は、&lagoon-projectを保持してください）
  &lagoon-project drupal-example

x-volumes:
  &default-volumes
    # Dockerコンテナにリアルタイムでマウントしたいすべてのボリュームを定義します
    volumes:
      - .:/app:delegated

x-environment:
  &default-environment
    LAGOON_PROJECT: *lagoon-project
    # ローカルで使用するルート。pygmyを使用している場合、このルートは *必ず* .docker.amazee.ioで終わるようにしてください
    LAGOON_ROUTE: http://drupal-example.docker.amazee.io
    # システムを本番環境のように動作させたい場合は以下の行のコメントアウトを解除してください
    #LAGOON_ENVIRONMENT_TYPE: production
    # xdebugを有効にし、`docker-compose up -d`で再起動したい場合は以下の行のコメントアウトを解除してください
    #XDEBUG_ENABLE: "true"

x-user:
  &default-user
    # コンテナが実行するデフォルトのユーザー。Linux上でid `1000`以外のユーザーとして実行する場合にはこれを変更します。
    user: '1000'

services:
  nginx:
    build:
      context: .
      dockerfile: nginx.dockerfile
    labels:
      lagoon.type: nginx-php-persistent
      lagoon.persistent: /app/web/sites/default/files/

  php:
    build:
      context: .
      dockerfile: php.dockerfile
    labels:
      lagoon.type: nginx-php-persistent
      lagoon.name: nginx
      lagoon.persistent: /app/web/sites/default/files/

  mariadb:
    image: uselagoon/mariadb-10.11-drupal
    labels:
      lagoon.type: mariadb
```


それぞれのオプションが何を意味するかを見てみましょう。

### 基本設定

`x-lagoon-project`:
これはプロジェクトのマシン名です、ここで定義します。"drupal-example"という例を使用します。

`x-volumes`:
これはLagoonにコンテナにマウントするものを指示します。ウェブアプリケーションは`/app`に存在しますが、必要に応じてこれを追加または変更できます。

`x-environment`:

- ここでローカル開発URLを設定できます。Pygmyを使用している場合、`.docker.amazee.io.`で終わらなければなりません。
- 本番環境と全く同じ環境を再現したい場合は、`LAGOON_ENVIRONMENT_TYPE: production`のコメントアウトを解除してください。
- x-debugを有効にしたい場合は、`DEBUG_ENABLE: "true"`のコメントアウトを解除してください。

`x-user`:
これを変更する必要はほとんどありませんが、Linuxを使用していて1000以外のユーザーとして実行したい場合は変更できます。

### `services` { #services }

`services`はデプロイしたいすべてのサービスを定義します。`docker-compose`はそれらをサービスと呼びますが、実際にはコンテナを定義しています。今後ドキュメンテーション全体でこれらをサービスと呼びます。

サービスの **名前** (上記の例では `nginx`、`php`、`mariadb`) は、生成される Kubernetes ポッド (これも別の用語ですが、ここではサービスと呼びます) の名前として Lagoon によって使用され、さらに定義された `lagoon.type` に基づいて作成される追加の Kubernetes オブジェクトの名前としても使用されます。これには、サービス、ルート、永続ストレージなどが含まれます。

### Docker イメージ { #docker-images }

デプロイ毎にサービス用のDockerfileをLagoonがビルドするよう設定したい場合、以下のように定義できます:

`build`
- `context` : Docker の `build` コマンドに渡すべきビルドコンテキストのパス。
- `dockerfile`: ビルドする Dockerfile の場所と名前。

!!! 注意
    Lagoon は `build: <Dockerfile>` の短縮形をサポートしておらず、この形式の定義が見つかるとビルドに失敗します。

`image`
- Dockerfile をビルドする必要がなく、既存の Dockerfile を使用する場合は、`image` で定義します。

この例では、現在のディレクトリのパスを指定しています。NGINX は `nginx.dockerfile` をビルドするように設定され、PHP は `php.dockerfile` をビルドするように設定されています。MariaDB は `uselagoon/mariadb-10.11-drupal` の既存のイメージを使用しています。Docker イメージの詳細については[こちら](../docker-images/commons.md) をご覧ください。

### タイプ { #types }

Lagoonは、正しいKubernetesのオブジェクトを設定するために、デプロイするサービスのタイプを知る必要があります。

これは `lagoon.type` ラベルを介して行われます。選択できるタイプは多岐にわたります。すべてのタイプと追加的な設定可能性を見るために、公開ドキュメンテーション [Service Types](../concepts-advanced/service-types.md) をご確認ください。

例では、PHPとNGINXのサービスは `nginx-php-persistent` としてタイプの定義しています。これはマルチコンテナポッドと呼ばれるものです。

### マルチコンテナポッド

Kubernetesは単独のコンテナをデプロイしません。代わりに、一つまたは複数のコンテナを含むポッドをデプロイします。通常、Lagoonは定義された `docker-compose` サービスに対して、一つのコンテナを含む単一のポッドを作成します。しかし、一部のケースでは、互いに依存度が高いため、二つのコンテナを単一のポッド内に配置する必要があります。DrupalのようなウェブアプリケーションのPHPコードを含むPHPとNGINXコンテナがその例です。

これらのケースでは、以下のようにしてLagoonにどのサービスが一緒に配置されるべきかを指示することが可能です:

1. 二つのサービスが必要な`lagoon.type`を指定して、それぞれのサービスを定義します（この例では、NGINXとPHPのサービスに`nginx-php-persistent`が設定されています）。
2. 二番目のサービスの`lagoon.name`ラベルを一番目のサービスに一致させてリンクします（例では`lagoon.name: nginx`により設定されています）。

これにより、Lagoonは `nginx` と `php` のサービスが `nginx` と呼ばれるポッドに結合されていることを認識します。

Lagoonは2つのサービスのうちどちらが個々のサービスタイプであるか(この場合は `nginx` と `php` )を理解する必要があります。これは、一致するサービスタイプのサービス名を検索することで行います。 `nginx-php-persistent` は、 `docker-compose.yml` の中で `nginx` という名前のサービスと `php` という名前のサービスを期待しています。

サービス名を変更したい場合や、`nginx-php-persistent`タイプの複数のポッドが必要な場合、`lagoon.deployment.servicetype`という追加のラベルを使用して、実際のサービスタイプを定義できます。

以下に、マルチコンテナポッドをより詳細に設定する例を示します:

```yaml title="docker-compose.yml"
nginx:
    build:
      context: .
      dockerfile: nginx.dockerfile
    labels:
      lagoon.type: nginx-php-persistent
      lagoon.persistent: /app/web/sites/default/files/
      lagoon.name: nginx # これが存在しない場合、Lagoonはコンテナの名前、この場合はnginxを使用します。
      lagoon.deployment.servicetype: nginx
php:
    build:
      context: .
      dockerfile: php.dockerfile
    labels:
      lagoon.type: nginx-php-persistent
      lagoon.persistent: /app/web/sites/default/files/
      lagoon.name: nginx # このサービスをLagoonのnginxポッドの一部にしたいです。
      lagoon.deployment.servicetype: php
```

docker-compose.ymlでできることはもっとありますが、サービスを設定することが最も重要な部分です。[`docker-compose.yml`に関する我々のドキュメンテーション](../concepts-basics/docker-compose-yml.md)をチェックして、他に何ができるかを学んでください。

## `.lagoon.yml`

[`.lagoon.yml`](../concepts-basics/lagoon-yml.md) ファイルはプロジェクト設定の中心となるファイルで、以下の設定を含んでいます:

- サイトへのアクセスルートを定義します。
- プレロールアウトタスクを定義します。
- ポストロールアウトタスクを定義する。
- SSL証明書を設定する。
- 環境のためのcronジョブを追加する。

`.lagoon.yml`ファイルを作成し、Gitリポジトリのルートに配置する必要があります。

以下は、Drupalサイト用の様々な設定オプションを示す`.lagoon.yml`ファイルの例です:

```yaml title=".lagoon.yml"

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
  insecure: Redirect

environments:
  main:
    monitoring_urls:
      - "www.example.com"
      - "www.example.com/special_page"
    routes:
      - nginx:
        - example.com
        - example.net
        - "www.example.com":
            tls-acme: 'true'
            insecure: Redirect
            hsts: max-age=31536000
        - "example.ch":
            Annotations:
              nginx.ingress.kubernetes.io/permanent-redirect: https://www.example.ch$request_uri
        - www.example.ch
    cronjobs:
     - name: drush cron
       schedule: "H * * * *" # 1時間に1回cronを実行します
       command: drush cron
       service: cli
  staging:
    cronjobs:
     - name: drush cron
       schedule: "H * * * *" # 1時間に1回cronを実行します。
       command: drush cron
       service: cli
```

### 一般設定

#### `docker-compose-yaml`

このファイルは、ビルドスクリプトにどの`docker-compose` YAMLファイルを使用するべきかを指示します。これにより、どのサービスとコンテナをデプロイするべきかを判断します。デフォルトは`docker-compose.yml`ですが、特定のLagoon `docker-compose` YAMLファイルが必要な場合に使用できます。

#### `environment_variables.git_sha`

この設定により、デプロイされた Git SHA を環境変数としてプロジェクトに挿入できるようになります。デフォルトでは無効になっています。値を `true` に設定すると、SHA が環境変数 `LAGOON_GIT_SHA` として設定されます。

### タスク { #tasks }

ビルドフローの中で実行されるタイミングによって、異なるタイプのタスクを定義できます：

#### プレロールアウトタスク - `pre_rollout.[i].run` { #pre-rollout-tasks-pre_rolloutirun }

`pre_rollout` タスクとして定義されたタスクは、新しいイメージが正常にビルドされた _後_、プロジェクトが何らかの形で変更される _前_ にプロジェクトに対して実行されます。この機能により、たとえば、上記の例のように、ロールアウトの実行前にデータベース ダンプを作成できます。これにより、ロールアウトで問題が発生した場合にロールバックしやすくなります。

#### ポストロールアウトタスク - `post_rollout.[i].run` { #post-rollout-tasks-post_rolloutirun }

ここでは、以下の条件が満たされた後にプロジェクトに対して実行する必要のあるタスクを指定できます：

- すべてのイメージが正常にビルドされた
- すべてのコンテナが新しいイメージで更新された
- 実行中のすべてのコンテナが準備状態チェックに合格した

`post_rollout` タスクの一般的な用途には、`drush updb`、`drush cim` の実行、またはさまざまなキャッシュのクリアが含まれます。上記の例では、`drush cim` と `drush cr` を実行します。

`name`

- name は、ログで各タスクを識別しやすくするための任意のラベルです。

`command`

- ここでは、実行するコマンドを指定します。これらは、各コンテナの `WORKDIR` で実行されます。Lagoon イメージの場合、これは `/app` です。タスクを実行するために特定の場所に `cd` する必要がある場合は、この点に注意してください。

`service`

- タスクを実行するサービス。私たちのdrupal-exampleに従っている場合、これはCLIコンテナになります。なぜなら、それはあなたのサイトのコード、ファイル、そしてデータベースへの接続を全て持っているからです。通常、これを変更する必要はありません。

`shell`

タスクの実行に使用するシェルを指定します。デフォルトでは `sh` が使用されますが、コンテナに他のシェル(bashなど)がある場合、ここでそれを定義することができます。これは、ポストロールアウト内でいくつかの小さなif/else bashスクリプトを実行したい場合に便利です。(上記の例で複数行のスクリプトを書く方法を参照してください)。

### ルート { #routes }

#### `routes.autogenerate.enabled`

これにより、自動生成されるルートを完全に無効にすることができます。これは環境ごとのカスタムルートを無効にするものではありません。詳細は下記を参照してください。

#### `routes.autogenerate.insecure`

これにより、自動生成されるルートの動作を定義できます。これは環境ごとのカスタムルートを設定するものではありません（詳細は後述）。これは上記の例で使用しているオプションで、`insecure: Redirect`と設定しています。

以下のオプションが許可されています:

`Allow`

- HTTPとHTTPSの両方のルートを設定します(これがデフォルトです)。

`Redirect`

- すべてのHTTPリクエストをHTTPSにリダイレクトします。

`None`

- HTTPのルートは作成されず、リダイレクトもありません。

### 環境

環境名は、デプロイされたブランチまたはプルリクエストに一致します。これにより、各環境は異なる設定を持つことができます。この例では、mainとstagingの環境を持っています。

#### 特定のパスの監視

UptimeRobotがクラスタに設定されている場合、Lagoonは各ルート/イングレスに`stakater/IngressControllerMonitor`で使用するためのアノテーションを注入します。デフォルトの動作はルートのホームページをモニタリングすることです。特定のルートを監視する必要がある場合、ルートの仕様に`monitoring-path`を追加することでこれを上書きできます。一般的な使用法は、キャッシュをバイパスする監視用のパスを設定することで、サイトのリアルタイム監視を実現します。

```yaml title=".lagoon.ymlの例"
     - "www.example.com":
            monitoring-path: "/bypass-cache"
```

#### `environments.[name].routes`

ルートセクションでは、環境が応答するドメイン名を指定します。通常、本番環境用のルートのみを指定します。すべての環境は生成されたルートを受け取りますが、本番以外の環境が独自のドメイン名を必要とする場合があります。ここで指定し、DNSプロバイダーでそのドメインを生成されたルート名へのCNAMEとして追加できます（これらのルートはデプロイメッセージで公開されます）。

環境設定の後に記述される最初の要素は、ターゲットサービスを指定します。この例ではNGINXがターゲットサービスとなっています。これにより、受信したリクエストをどのサービスに転送するかを指定しています。

最もシンプルなルートは、上記のサンプル`.lagoon.yml`にある`example.com`の例です。追加の設定がないことがわかります。これは、ルートにLet's Encrypt証明書が必要で、HTTPSからHTTPへのリダイレクトが不要であることを前提としています。

#### アノテーション

!!! Info "情報"
    ルート/イングレスアノテーションは、`nginx-ingress`コントローラーを実行しているクラスタにデプロイするプロジェクトでのみサポートされています。この機能がサポートされているかどうかは、Lagoon管理者に確認してください。

アノテーションは、nginx-ingressコントローラーがサポートするYAMLマップ形式で記述できます。これは簡単なリダイレクトに便利です:

例えば、`example.ch`へのリクエストを`https://www.example.ch`にリダイレクトし、フォルダやクエリパラメータを維持したい場合は以下のように設定します:

`(example.com/folder?query -> https://www.example.ch/folder?query)`

```yaml title=".lagoon.yml の例"
        - "example.ch":
            annotations:
              nginx.ingress.kubernetes.io/permanent-redirect: https://www.example.ch$request_uri
        - www.example.ch
```

もちろん、Lagoonでホストされていない他のURLへのリダイレクトも可能です。例えば、`example.de`へのリクエストを`https://www.google.com`にリダイレクトする場合:

```yaml title=".lagoon.yml の例"
        - "example.de":
            annotations:
              nginx.ingress.kubernetes.io/permanent-redirect: https://www.google.com
```

#### SSL設定 - `tls-acme`

`tls-acme : ‘true’`

- Lagoonにそのルートに対してLet's Encrypt証明書を発行するよう指示します。これがデフォルトです。
- Let's Encryptが不要な場合、これを `tls-acme: ‘false’` に設定します。

`insecure`

- `Allow`：HTTPとHTTPS両方のルートを設定します（デフォルト）。
- `Redirect`：HTTPリクエストをHTTPSにリダイレクトします。
- `None`：HTTPルートは作成されず、リダイレクトも行われません。

`None`

- HTTPのルートは作成されず、リダイレクトも行われません。

`Hsts`

- `max-age=31536000;includeSubDomains;preload`のような値を設定できます。
- スペースや他のパラメータが含まれていないことを確認します。
- `max-age`パラメータのみが必須です。これはHSTSポリシーの有効期間を秒単位で指定します。

!!! Info "Info"
    証明書認証局(CA)によって署名された SSL 証明書から Let's Encrypt 証明書に切り替える予定がある場合は、Lagoon の管理者に連絡して移行を監督してもらうのが最善です。

#### `environments.[name].types`

Lagoon のビルドプロセスは `docker-compose.yml` ファイルの `lagoon.type` ラベルをチェックして、どのタイプのサービスをデプロイするべきかを判断します([docker-compose.yml のドキュメンテーション](../concepts-basics/docker-compose-yml.md)で詳細を読むことができます)。

特定の環境でのみタイプをオーバーライドしたい場合があります。

##### `service-name: service-type

- `service-name`は`docker-compose.yml`からオーバーライドしたいサービスの名前です。
- `service-type` オーバーライドで使用したいサービスのタイプです。

例えば、`main`という名前の本番環境用にMariaDB-Galeraの高可用性データベースを使用したい場合:

```yaml title=".lagoon.yml 例"
environments:
  main:
    types:
      mariadb: mariadb-galera
```

#### `environments.[name].templates`

Lagoonビルドプロセスは、`docker-compose.yml`ファイルの`lagoon.template`ラベルをチェックして、サービスにカスタムテンプレートファイルが必要かどうかを確認します([docker-compose.ymlのドキュメンテーション](../concepts-basics/docker-compose-yml.md)で詳しく読むことができます)。

特定の環境でのみテンプレートをオーバーライドしたい場合:

##### `service-name: template-file`

- `service-name`は、`docker-compose.yml`からオーバーライドしたいサービスの名前です。
- `template-file`は、この環境でこのサービスに使用するテンプレートのパスと名前です。

```yaml title=".lagoon.yml 例"
environments:
  main:
    templates:
      mariadb: mariadb.main.deployment.yml
```

#### `environments.[name].rollouts`

Lagoonビルドプロセスは、`docker-compose.yml`ファイルの`lagoon.rollout`ラベルをチェックして、サービスにカスタムテンプレートファイルが必要かどうかを確認します([docker-compose.ymlのドキュメンテーション](../concepts-basics/docker-compose-yml.md)で詳しく読むことができます)。

すべての環境に対してではなく、ひとつの環境に対してだけタイプをオーバーライドしたい場合もあります。

##### `service-name: rollout-type`

- `service-name`は上書きしたい`docker-compose.yml`のサービス名です。
- `rollout-type`はロールアウトのタイプです。可能な値については[docker-compose.ymlのドキュメンテーション](../concepts-basics/docker-compose-yml.md)を参照してください。

```yaml title=".lagoon.yml 例"
environments:
  main:
    rollouts:
      mariadb: statefulset
```

#### Cronジョブ - `environments.[name].cronjobs`

通常、全ての環境で同じCronジョブを実行することは望ましくありません。そのため、各環境で実行したいジョブを明示的に定義する必要があります。例として、1時間に1回実行するdrush cronジョブを作成します。

`name`

- Cronジョブの目的を識別するためのわかりやすい名前。

`schedule`

- Cronジョブの実行スケジュールです。標準的なcron記法に従います。構文が不明な場合は、[Crontab Generator](https://crontab-generator.org/)が役立ちます。
- 分`M`を指定すると、毎時間ランダムな分（毎時同じ分）に実行されます。`M/15`とすると15分ごとに実行されますが、時間からのオフセットはランダムです（例：6, 21, 36, 51）。
- 時`H`を指定すると、毎日ランダムな時間（毎日同じ時間）に実行されます。`H(2-4)`とすると、2時から4時の間に1回実行されます。

`command`

- 実行するコマンド。タスクと同様に、このコマンドはサービスの `WORKDIR` で実行されます。Lagoonのイメージでは、これは `/app` です。

`service`

- コマンドを実行するプロジェクトのサービス。ほとんどのプロジェクトでは、これはCLIサービスです。

`.lagoon.yml` でできることはまだたくさんあります。詳細は [`.lagoon.yml` についてのドキュメンテーション](../concepts-basics/lagoon-yml.md) をご覧ください。

## Drupal特有のセットアップ

DrupalサイトをLagoonに移行する場合、全てをセットアップするためにいくつかDrupal特有のタスクを完了する必要があります。

### 設定ファイル

次のステップは設定ファイルの更新です。Lagoonは環境変数を使用する環境固有の設定ファイルを使用します。これにより、機密情報がこれらのファイルに保存されることはなく、すべて安全にコミットできます。[リポジトリ](https://github.com/uselagoon/lagoon-examples)に様々なプロジェクト例があります。新規に始める場合は、これらの使用をお勧めします。そうでない場合は、類似のものを選んで関連する設定ファイルをコピーしてください。環境変数の使用方法については、[環境変数のドキュメント](../concepts-advanced/environment-variables.md)をご覧ください。

リポジトリから設定ファイルをコピーし、サイトで使用していないサービスの設定を削除してください（例：すべてのサイトがSolrやRedisを使用しているわけではありません）。特定の環境タイプ（開発環境でのキャッシュ無効化など）の設定をオーバーライドする必要がある場合、追加の設定ファイルを設定できます（例示リポジトリにすでにいくつか用意されています）。ファイルは以下の順序で読み込まれます：

```php title="settings.php"

 all.settings.php
 all.services.yml
 production.settings.php
 production.services.yml
 development.settings.php
 development.services.yml
 settings.local.php
 services.local.yml
```

### ``.gitignore``の設定を更新する

`.gitignore`が設定ファイルのコミットを許可するようにすることを確認してください。Drupalはデフォルトで`sites/*/settings*.php`と`sites/*/services*.yml`を`.gitignore`に含めています。Lagoonでは機密情報をGitリポジトリに保存しないので、これらを削除できます。

### DrupalのWebrootについての注意点

残念ながら、Drupalコミュニティはウェブルートフォルダ名を標準化していません。プロジェクトによってはDrupalを`/web`内に、他は`/docroot`や他の場所に配置しています。Lagoon Drupal設定ファイルは、Drupalが`/web`内にあることを前提としています。もしあなたのDrupalインストールが異なる場合は、ファイルを適宜調整してください。

### イメージのビルドする

まず、定義されたイメージをビルドする必要があります:

```bash title="build your images"
docker-compose build
```

これには数分かかる場合があり、長いレスポンスが返ってきます。[このようなものになるはずです](https://gist.github.com/AlannaBurke/1bdad6aab977b0994c245834e61b6b50)。

これにより、docker-composeは`docker-compose.yml`内で`build:`定義があるすべてのコンテナのDockerイメージをビルドします。通常、Drupalの場合、これには`cli`、`nginx`、`php`が含まれます。特定のビルドコマンド（`composer install`など）を実行したり、特定の環境変数（`WEBROOT`など）をイメージに注入したりするために行います。

通常、 Drupalのコードを編集するたびにビルドする必要はありません(コードはホストからコンテナにマウントされます)、しかし再ビルドは問題ありません。さらに、Lagoonはデプロイ中に全く同じDockerイメージをビルドするので、`docker-compose build` を再度実行するだけで、ビルドがデプロイ中にも機能することを確認できます。

### コンテナの起動

イメージがビルドされたので、コンテナを起動できます:

```bash title="start the containers"
docker-compose up -d
```

次のような応答が表示されます:

```bash title="containers started"
➜  lagoon-test git:(main) docker compose up -d
Recreating lagoon-test_cli_1   ... done
Starting lagoon-test_redis_1   ... done
Starting lagoon-test_solr_1    ... done
Starting lagoon-test_mariadb_1 ... done
Recreating lagoon-test_php_1   ... done
Recreating lagoon-test_nginx_1 ... done
Recreating lagoon-test_varnish_1 ... done
```

これによりすべてのコンテナが起動します。コマンドが完了した後、`docker compose ps`で確認して、すべて完全に起動し、クラッシュしていないことを確認できます。その応答は次のようになるはずです:

```bash title="view running containers"
➜  lagoon-test git:(main) docker compose ps
Name                       Command               State            Ports
----------------------------------------------------------------------------------------
lagoon-test_cli_1       /sbin/tini -- /lagoon/entr ...   Up      9000/tcp
lagoon-test_mariadb_1   /sbin/tini -- /lagoon/entr ...   Up      0.0.0.0:32768->3306/tcp
lagoon-test_nginx_1     /sbin/tini -- /lagoon/entr ...   Up      8080/tcp
lagoon-test_php_1       /sbin/tini -- /lagoon/entr ...   Up      9000/tcp
lagoon-test_redis_1     /sbin/tini -- /lagoon/entr ...   Up      6379/tcp
lagoon-test_solr_1      /sbin/tini -- /lagoon/entr ...   Up      0.0.0.0:32769->8983/tcp
```

問題がある場合は、 `docker-compose logs -f [servicename]`を使用してログを確認します。

### `composer install`の再実行（Composerプロジェクトのみ）

Drupal 8以降のプロジェクトを実行している場合、Composerを使用しているはずです。全ての依存関係をダウンロードしてインストールする必要があります。cliコンテナに接続し、`composer install`を実行します：

```bash title="re-run composer install"
docker-compose exec cli bash
[drupal-example]cli-drupal:/app$ composer install
```

これは奇妙に聞こえるかもしれません。ビルド段階ですでに`composer install`が実行されているからです。再度実行する理由は以下の通りです：

- ホスト上でファイルを編集し、すぐにコンテナで利用できるようにするため、デフォルトの`docker-composer.yml`はフォルダ全体をコンテナにマウントします（これは`volumes`セクションの.`:/app:delegated`で行われます）。これは、Dockerビルド中にインストールされた全ての依存関係がホスト上のファイルで上書きされることも意味します。
- ローカルでは、おそらく`composer.json`の`require-dev`で定義された依存関係にアクセスしたいでしょうが、本番デプロイではそれらは不要なスペースを使用するだけです。そのため、Dockerfileでは`composer install --no-dev`を実行し、手動で`composer install`を実行します。

全てが上手くいった場合、`docker-compose.yml`で定義された`LAGOON_ROUTE`（例：`http://drupal.docker.amazee.io`）を開くと、Drupalのエラーが表示されるはずです。心配しないでください - 今のところこれで問題ありません。最も重要なのは、Drupalサイトを読み込もうとしていることです。

500または同様のエラーが発生した場合は、Composerで全てが正しく読み込まれていることを確認してください。

### ステータスの確認とDrupalのインストール

最後にDrupalをインストールする時が来ましたが、その前に全てが正常に動作していることを確認しましょう。そのためにDrushを使用することをお勧めします。`drush status`を実行します：

```bash title="run drush status"
docker-compose exec cli bash
[drupal-example]cli-drupal:/app$ drush status
```

上記のコマンドは、以下のような結果を返すはずです:

```bash title="drush status results"
[drupal-example]cli-drupal:/app$ drush status
[notice] Missing database table: key_value
Drupal version       :  8.6.1
Site URI             :  http://drupal.docker.amazee.io
Database driver      :  mysql
Database hostname    :  mariadb
Database port        :  3306
Database username    :  drupal
Database name        :  drupal
PHP binary           :  /usr/local/bin/php
PHP config           :  /usr/local/etc/php/php.ini
PHP OS               :  Linux
Drush script         :  /app/vendor/drush/drush/drush
Drush version        :  9.4.0
Drush temp           :  /tmp
Drush configs        :  /home/.drush/drush.yml
                        /app/vendor/drush/drush/drush.yml
Drupal root          :  /app/web
Site path            :  sites/default

```

!!! Info "情報"
    次のステップに進む前に、公開鍵についてpygmyに伝える必要があるかもしれません。`Permission denied (publickey)`というエラーが表示された場合は、こちらのドキュメンテーションを確認してください:[pygmy - sshキーの追加](https://pygmystack.github.io/pygmy/usage/#adding-ssh-keys)。

これでDrupalをインストールする時が来ました（代わりに既存のSQLファイルをインポートしたい場合は、次のステップに進んでください。ただし、最初はクリーンなDrupalをインストールして、全てが動作することを確認することをお勧めします）。

```bash title="drush siの実行"
[drupal-example]cli-drupal:/app$ drush site-install
```
これにより、次のような出力が表示されるはずです:

```bash title="drush siの結果"
[drupal-example]cli-drupal:/app$ drush site-install
You are about to DROP all tables in your 'drupal' database. Do you want to continue? (y/n): y
Starting Drupal installation. This takes a while. Consider using the --notify global option.
Installation complete.  User name: admin  User password: arbZJekcqh
Congratulations, you installed Drupal!
```

これで`LAGOON_ROUTE`で定義されたURLにアクセスすると、新しくクリーンにインストールされたDrupalが表示されるはずです - おめでとうございます！

### 既存のデータベースダンプのインポート

既存のDrupalサイトがある場合、そのデータベースをローカルサイトにインポートしたいでしょう。データベースダンプを作成する方法は多数ありますが、現在のホスティングプロバイダにDrushがインストールされている場合は、以下のように使用できます：

```bash title="drush sql-dump"
[your-existing-site]$ drush sql-dump --result-file=dump.sql
Database dump saved to dump.sql                         [success]
```

これで、データベース全体を含むdump.sqlファイルができました。このファイルをローカルのGitリポジトリにコピーし、CLIに接続すると、そこにファイルが表示されるはずです：

```bash title="dump file"
[drupal-example] docker compose exec cli bash
[drupal-example]cli-drupal:/app$ ls -l dump.sql
-rw-r--r--    1 root     root          5281 Dec 19 12:46 dump.sql
```
これで、現在のデータベースを削除した後にダンプをインポートできます（まだcliに接続したままです）：

```bash title="dump existing db and import dump file"
[drupal-example]cli-drupal:/app$ drush sql-drop
Do you really want to drop all tables in the database drupal? (y/n): y
[drupal-example]cli-drupal:/app$ drush sql-cli < dump.sql
```

### Drupalファイルディレクトリ

Drupalサイトにはファイルディレクトリも含まれます。既存のサイトからファイルを移行するには、正しいフォルダ（おそらく`web/sites/default/files`、`sites/default/files`、または類似のもの）にファイルを追加するだけです。ウェブルートとして設定したものを覚えておいてください - プロジェクトによって異なる場合があります。

## デプロイ

このガイドの全ての手順を完了し、Lagoon管理者が全てを設定していれば、サイトをデプロイする準備が整いました！

Drupalサイトをデプロイする場合は、[このデプロイガイド](../applications/drupal/first-deployment-of-drupal.md)を参照してください。

それ以外の全てのデプロイについては、[このデプロイガイド](../using-lagoon-the-basics/first-deployment.md)を参照してください。
