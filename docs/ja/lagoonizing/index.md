# 既存のサイトをラグーン化する

_ラグーン化_、つまり既存のサイトをラグーンプラットフォームに対応させることは、一般的には難しくありません（サイトやセットアップによりますが）、しかしいくつかの手順が必要です。このプロセスを簡単にするためのステップバイステップのガイドをまとめました。

## 要件

あなたのシステムがローカルでラグーンを使用するための[要件を満たしている](../using-lagoon-the-basics/index.md)ことを確認してください。

## ローカル開発環境

[ローカル開発環境を設定する](../using-lagoon-the-basics/local-development-environments.md)。PygmyとLandoのどちらかを選ぶことができます。

## コマンドラインとGit

コマンドラインを通じてラグーンとやりとりする必要があり、またGitも必要ですので、準備が整っていることを確認してください。

### コマンドライン

いくつかのタスクにはコマンドラインターミナルを使用する必要があります。何を使用しても構いません、オペレーティングシステムのデフォルトツールも含めてです。以下にいくつかのオプションを示します：

- [iTerm2](https://iterm2.com/) (Mac)
- [PowerShell](https://docs.microsoft.com/en-us/powershell/) (Windows)
- [Fish](https://fishshell.com/) (Mac, Windows, Linux)
- [Tabby](https://tabby.sh/) (Mac, Windows, Linux)

### Gitのインストール

まだ持っていない場合は、 何らかの形でGitクライアントが必要です。コマンドライン、GUI、何でも構いません（私たちの例では、コマンドラインを使用します）。以下にいくつかのオプションを示します：

- [Gitのインストール](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) (Mac、Windows、Linux)
- [SourceTree](https://www.sourcetreeapp.com/) (Mac、Windows)
- [GitHub Desktop](https://desktop.github.com/) (Mac、Windows)
- [GitKraken](https://www.gitkraken.com/git-client) (Mac、Windows、Linux - 公開リポジトリは無料)

## ラグーン管理者が必要とするもの

ラグーンを設定しているラグーン管理者は、いくつかの情報を必要とします。[詳細はこちら](../using-lagoon-the-basics/setup-project.md)。

## Webhooksの設定

次に、Gitリポジトリのためのwebhooksを設定する必要があります。[その手順はこちらで見つけることができます](../using-lagoon-the-basics/configure-webhooks.md)。

## `docker-compose.yml`

`docker-compose.yml`ファイルは、Lagoonによって以下のように使用されます：

- どのサービス/コンテナをデプロイするべきかを学ぶ。
- コンテナのイメージがどのようにビルドされるかを定義する。
- 永続ボリュームなどの追加設定を定義する。

さらに詳しくは[私たちの`docker-compose.yml`ドキュメンテーション](../concepts-basics/docker-compose-yml.md).

これは、あなたのサイトをLagoonに対応させるために作成・設定する2つのファイルのうちの1つです。

`Docker-compose`（ツール）は、YAMLファイルの内容を厳格に検証するので、サービス定義の**ラベル**内でのみ設定を行うことができます。

!!! warning "警告"

    Lagoonは`docker-compose.yml`ファイルからラベル、サービス名、イメージ名、ビルド定義のみを読み込みます。ポート、環境変数、ボリューム、ネットワーク、リンク、ユーザーなどの定義は無視されます。これは意図的なもので、`docker-compose`ファイルはあなたのローカル環境設定を定義するためのものです。Lagoonは`lagoon.type`からあなたがデプロイしているサービスのタイプを学び、その結果、このサービスが必要とする可能性のあるポート、ネットワーク、その他の追加設定について知ることができます。

基本的なサービスの設定方法をいくつか見てみましょう。この例では、Drupal、Laravel、その他のコンテンツマネジメントシステムなど、多くのシステムに必要なNGINX、PHP、MariaDBを設定します。

以下は、Drupal用の`docker-compose.yml`ファイルの直接的な例です：

```yaml title="docker-compose.yml"
version: '2.3'

x-lagoon-project:
  # Lagoonプロジェクト名（ この)を編集するときに `&lagoon-project`を残してください
  &lagoon-project drupal-example

x-volumes:
  &default-volumes
    # Dockerコンテナにリアルタイムでマウントしたいすべてのボリュームを定義します
    volumes:
      - .:/app:delegated

x-environment:
  &default-environment
    LAGOON_PROJECT: *lagoon-project
    # ローカルで使用するルート。pygmyを使用している場合、このルートは *必ず* .docker.amazee.ioで終わらなければなりません
    LAGOON_ROUTE: http://drupal-example.docker.amazee.io
    # システムを本番環境のように動作させたい場合はコメントアウトを解除してください
    #LAGOON_ENVIRONMENT_TYPE: production
    # xdebugを有効にし、`docker-compose up -d`で再起動したい場合はコメントアウトを解除してください
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
      lagoon.type: nginx-php-persistent lagoon.name：nginx
      lagoon.persistent：/app/web/sites/default/files/

  mariadb:
    image: amazeeio/mariadb-drupal
    labels:
      lagoon.type: mariadb
```


それぞれのオプションが何を意味するかを見てみましょう。

### 基本設定

`x-lagoon-project`：
これはプロジェクトのマシン名です、ここで定義します。"drupal-example"という例を使用します。

`x-volumes`：
これはLagoonにコンテナにマウントするものを指示します。ウェブアプリケーションは`/app`に存在しますが、必要に応じてこれを追加または変更できます。

`x-environment`：

- ここでローカル開発URLを設定できます。Pygmyを使用している場合、`.docker.amazee.io.`で終わらなければなりません。
- 本番環境を完全に模倣したい場合は、`LAGOON_ENVIRONMENT_TYPE: production`のコメントを解除します。
- x-debugを有効にしたい場合は、`DEBUG_ENABLE: "true"`のコメントを解除します。

`x-user`：
これを変更する必要はほとんどありませんが、Linuxを使用していて1000以外のユーザーとして実行したい場合は変更できます。

### `services`

これはデプロイしたいすべてのサービスを定義します。残念ながら、`docker-compose`はそれらをサービスと呼びますが、実際にはコンテナを定義しています。今後、これらをサービスと呼び、このドキュメンテーション全体で呼びます。

サービスの**名前**は Translation request timed out. -images/commons.md).

### タイプ

Lagoonは、正しいKubernetesのオブジェクトを設定するために、デプロイするサービスのタイプを知る必要があります。

これは `lagoon.type` ラベルを介して行われます。選択できるタイプは多岐にわたります。すべてのタイプと追加的な設定可能性を見るために、私たちの公開ドキュメンテーション [Service Types](../concepts-advanced/service-types.md) を読んでください。

例で気づいたかもしれませんが、PHPとNGINXのサービスは両方ともタイプを `nginx-php-persistent` と定義しています。それは彼らがいわゆるマルチコンテナポッドだからです。

### マルチコンテナポッド

Kubernetesはプレーンなコンテナをデプロイしません。代わりに、それは1つ以上のコンテナを持つポッドをデプロイします。通常、Lagoonは定義された `docker-compose` サービスごとにコンテナを内部に持つ単一のポッドを作成します。しかし、いくつかのケースでは、これらのコンテナが互いに非常に依存しているため、単一のポッド内に2つのコンテナを置く必要があります。そのような状況の例は、DrupalのようなウェブアプリケーションのPHPコードを含むPHPとNGINXのコンテナです。

これらのケースでは、どのサービスが一緒に留まるべきかをLagoonに伝えることが可能です。 一緒に。これは以下の方法で行われます（私たちはコンテナをサービスと呼んでいることを覚えておいてください）：

1. 両方のサービスを `lagoon.type` で定義し、それが2つのサービスを期待している（この例では、NGINXとPHPのサービスで定義されている `nginx-php-persistent` ）。
2. 2番目のサービスを1番目のサービスにリンクし、2番目のサービスのラベル `lagoon.name` を1番目のものと一致させます（この例では `lagoon.name: nginx` の設定によりこれが行われます）。

これにより、Lagoonは `nginx` と `php` のサービスが `nginx` と呼ばれるポッドに結合されていることを認識します。

Lagoonはまだ、2つのサービスのうちどちらが _実際の_ 個々のサービスタイプであるか（この場合は `nginx` と `php` ）を理解する必要があります。これは、一致するサービスタイプのサービス名を検索することでこれを行います。 `nginx-php-persistent` は、 `docker-compose.yml` の中で `nginx` という名前のサービスと `php` という名前のサービスを期待しています。

何らかの理由でサービスの名前を変更したい場合や、 `nginx-php-persistent` のタイプを持つ複数のポッドが必要な場合は、実際のサービスタイプを定義するために使用できる追加のラベル `lagoon.deployment.servicetype` があります。

以下に、マルチコンテナポッドがどのようになるかを示す例を示します。 詳細に設定する：

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

[`.lagoon.yml`](../concepts-basics/lagoon-yml.md) ファイルは、プロジェクトを設定するための中心的なファイルです。以下を行うための設定が含まれています：

- サイトへのアクセスルートを定義します。
- プレロールアウトタスクを定義します。 - ポストロールアウトタスクを定義する。
- SSL証明書を設定する。
- 環境のためのcronジョブを追加する。

`.lagoon.yml`ファイルを作成し、Gitリポジトリのルートに配置する必要があります。

以下に、私たちが説明するDrupalサイトの様々な設定オプションを示す例の`.lagoon.yml`ファイルを示します：

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
            hsts: max
``` -年齢=31536000
        - "example.ch":
            アノテーション:
              nginx.ingress.kubernetes.io/permanent-redirect: https://www.example.ch$request_uri
        - www.example.ch

    タイプ:
      マリアDB: mariadb-galera
    テンプレート:
      マリアDB: mariadb.main.deployment.yml
    ロールアウト:
      マリアDB: statefulset
    クロンジョブ:
     - 名前: drush cron
       スケジュール: "H * * * *" # これはクロンを1時間ごとに実行します。
       コマンド: drush cron
       サービス: cli
  ステージング:
    クロンジョブ:
     - 名前: drush cron
       スケジュール: "H * * * *" # これはクロンを1時間ごとに実行します。
       コマンド: drush cron
       サービス: cli
```

### 一般設定

#### `docker-compose-yaml`

このファイルは、どのサービスとコンテナがデプロイされるべきかを知るために、どの`docker-compose`YAMLファイルをビルドスクリプトが使用すべきかを指示します。これはデフォルトで`docker-compose.yml`になりますが、特定のLagoon `docker-compose` YAMLファイルが必要な場合にはこれを使用することができます。

#### `environment_variables.git_sha`

この設定は、デプロイされたGit SHAを環境変数としてプロジェクトに注入することを可能にします。デフォルトではこれは無効化されています。値を`true`に設定すると Translation request timed out. これらは各コンテナの `WORKDIR`で実行されます。Lagoon画像の場合、これは `/app` なので、タスクを実行するために特定の場所に`cd`する必要がある場合はこれを念頭に置いてください。

`service`

- タスクを実行するサービス。私たちのdrupal-exampleに従っている場合、これはCLIコンテナになります。なぜなら、それはあなたのサイトのコード、ファイル、そしてデータベースへの接続を全て持っているからです。通常、これを変更する必要はありません。

`shell`

タスクを実行するためにどのシェルを使用するべきか。デフォルトでは `sh` が使用されますが、コンテナに他のシェル（bashなど）がある場合、ここでそれを定義することができます。これは、post-rollouts内でいくつかの小さなif/else bashスクリプトを実行したい場合に便利です。(上記の例で複数行のスクリプトを書く方法を参照してください)。

### ルート

#### `routes.autogenerate.enabled`

これにより、自動的に作成されたルートをまったく無効にすることができます。これは環境ごとのカスタムルートを無効にするものではありません。それについては下記を参照してください。

#### `routes.autogenerate.insecure`

これにより、自動的に作成されたルートの挙動を定義することができます。これは環境ごとのカスタムルートを設定するものではありません。それについては下記を参照してください。これは、上記の例で使用しているオプションで、`insecure: リダイレクト。

以下のオプションが許可されています：

`許可`

- HTTPとHTTPSの両方のルートを設定します（これがデフォルトです）。

`リダイレクト`

- すべてのHTTPリクエストをHTTPSにリダイレクトします。

`なし`

- HTTPのルートは作成されず、リダイレクトもありません。

### 環境

環境名は、デプロイされたブランチまたはプルリクエストに一致します。これにより、各環境は異なる設定を持つことができます。この例では、メインとステージングの環境を持っています。

#### 特定のパスの監視

UptimeRobotがクラスターに設定されている場合、Lagoonは各ルート/イングレスにアノテーションを注入し、`stakater/IngressControllerMonitor`が使用します。デフォルトのアクションはルートのホームページを監視することです。特定のルートを監視する必要がある場合、ルートの仕様に`monitoring-path`を追加することでこれを上書きできます。一般的な使用法は、キャッシュをバイパスする監視用のパスを設定することで、サイトのリアルタイム監視をより実現します。

```yaml title=".lagoon.ymlの例"
     - "www.example.com":
            monitoring-path: "/bypass-cache"
```

#### `environments.[name].routes`

ルートセクションでは、環境が対応するドメイン名を特定します。それは 通常、ルートが指定された環境は本番環境だけです。すべての環境は生成されたルートを受け取りますが、非本番環境が独自のドメイン名を持つ必要がある場合もあります。ここでそれを指定し、そのドメインを生成されたルート名のCNAMEとしてDNSプロバイダに追加できます（これらのルートはデプロイメッセージで公開されます）。

環境の次の要素は、ターゲットサービスで、例ではNGINXです。これにより、どのサービスに入力リクエストを送るかを特定します。

最も単純なルートは、上記のサンプル`.lagoon.yml`の`example.com`の例で、追加の設定がないことがわかります。これは、ルートのLet's Encrypt証明書を希望し、HTTPSからHTTPへのリダイレクトがないと仮定します。

#### 注釈

!!! info
    ルート/Ingress注釈は、nginx-ingressコントローラを実行するクラスタにデプロイされるプロジェクトでのみサポートされています！これがサポートされているかどうかはLagoonの管理者に確認してください。

注釈は、`nginx-ingress`コントローラがサポートする注釈のYAMLマップであることが特に便利で、簡単にリダイレクトできます：

この例では、`example.ch`への任意のリクエストがリダイレクトされます。 `https://www.example.ch` への移動、フォルダやクエリパラメータを維持します:

`(example.com/folder?query -> https://www.example.ch/folder?query)`

```yaml title=".lagoon.yml の例"
        - "example.ch":
            annotations:
              nginx.ingress.kubernetes.io/permanent-redirect: https://www.example.ch$request_uri
        - www.example.ch
```

もちろん、Lagoonでホストされていない他のURLにもリダイレクトできます。これは `example.de` のリクエストを `https://www.google.com` にリダイレクトします:

```yaml title=".lagoon.yml の例"
        - "example.de":
            annotations:
              nginx.ingress.kubernetes.io/permanent-redirect: https://www.google.com
```

#### SSL設定 - `tls-acme`

`tls-acme : ‘true’`

- このルートに対してLagoonがLet's Encrypt証明書を発行することを示します。これがデフォルトです。
- Let's Encryptが不要な場合、これを `tls-acme: ‘false’` に設定します。

`insecure`

- `None`、`Allow`、または `Redirect` に設定できます。
- Allowは単にHTTPとHTTPSの両方のルートを設定します（これがデフォルトです）。
- `Redirect` は、HTTPのリクエストをHTTPSにリダイレクトします。

`None`

- HTTPのルートは作成されず、リダイレクトも行われません。

`Hsts`

- 設定することができます `max-age=31536000;includeSubDomains;preload`の値に。
- スペースや他のパラメータが含まれていないことを確認します。
- 必要なのは`max-age`パラメータのみです。この必要な max-age パラメータは、HSTS ポリシーが有効な時間を秒単位で指定します。

!!! info
    証明書認証局（CA）によって署名された SSL 証明書から Let's Encrypt 証明書に切り替える予定がある場合は、Lagoon の管理者に連絡して移行を監督してもらうのが最善です。

#### `environments.[name].types`

Lagoon のビルドプロセスは `docker-compose.yml` ファイルの `lagoon.type` ラベルをチェックして、どのタイプのサービスをデプロイすべきかを学びます（[docker-compose.yml のドキュメンテーション](../concepts-basics/docker-compose-yml.md)で詳細を読むことができます）。

時々、全てではなく一つの環境だけでタイプを上書きしたいかもしれません。

##### `service-name: service-type

- `service-name` は上書きしたい `docker-compose.yml` のサービスの名前です。
- `service-type` はあなたが上書きで使用したいサービスのタイプです。

例えば、あなたがプロダクション用の MariaDB-Galera 高可用性データベースを求めている場合、 メインと呼ばれる環境 - これが私たちの例のファイルで行っていることです:

```yaml title=".lagoon.yml example"
environments:
  main:
    types:
      mariadb: mariadb-galera
```

#### `environments.[name].templates`

Lagoonのビルドプロセスは、`docker-compose.yml`ファイルから`lagoon.template`ラベルを確認し、サービスがカスタムテンプレートファイルが必要かどうかを確認します([docker-compose.ymlのドキュメンテーション](../concepts-basics/docker-compose-yml.md)で詳しく読むことができます)。

場合によっては、すべての環境ではなく、単一の環境だけでテンプレートを上書きすることが必要かもしれません:

##### `service-name: template-file`

- `service-name`は、`docker-compose.yml`から上書きしたいサービスの名前です。
- `template-file`は、この環境でこのサービスに使用するテンプレートのパスと名前です。

```yaml title=".lagoon.yml example"
environments:
  main:
    templates:
      mariadb: mariadb.main.deployment.yml
```

#### `environments.[name].rollouts`

Lagoonのビルドプロセスは、`docker-compose.yml`ファイルから`lagoon.rollout`ラベルを確認し、サービスが特別なロールアウトタイプが必要かどうかを確認します([dockerのドキュメンテーションで詳しく読むことができます。 -compose.yml](../concepts-basics/docker-compose-yml.md))。

時折、特に環境のテンプレートタイプを上書きした場合には、単一の環境だけでロールアウトタイプを上書きしたいことがあります。

##### `service-name: rollout-type`

- `service-name`は上書きしたい`docker-compose.yml`のサービス名です。
- `rollout-type`はロールアウトのタイプです。可能な値については[docker-compose.ymlのドキュメンテーション](../concepts-basics/docker-compose-yml.md)を参照してください。

```yaml title=".lagoon.yml example"
environments:
  main:
    rollouts:
      mariadb: statefulset
```

#### Cronジョブ - `environments.[name].cronjobs`

ほとんどの場合、すべての環境で同じcronジョブを実行することは望ましくないため、各環境で実行したいジョブを明示的に定義する必要があります。私たちの例では、1時間ごとに実行されるdrushのcronジョブを作成しています。

`name`

- cronジョブの動作を識別するための親切な名前。

`schedule`

- cronジョブを実行するスケジュール。これはcronの標準的な規則に従います。構文に自信がない場合は、[Crontab Generator](https://crontab-generator.org/)が役立ちます。
- `M`を指定することができます。 - 分毎に `M` を指定すると、あなたの cron ジョブは毎時間ランダムな分に一度実行されます（毎時間同じ分）。または、`M/15` を指定すると、毎時間15分ごとに実行されますが、時間からのランダムなオフセット（6、21、36、51など）で実行されます。
- 時間に `H` を指定すると、あなたの cron ジョブは毎日ランダムな時間に一度実行されます（毎日同じ時間）。または、`H(2-4)` を指定すると、2時から4時の間に一度だけ実行されます。

`command`

- 実行するコマンド。タスクと同様に、このコマンドはサービスの `WORKDIR` で実行されます。Lagoonのイメージでは、これは `/app` です。

`service`

- コマンドを実行するプロジェクトのサービス。ほとんどのプロジェクトでは、これはCLIサービスです。

`.lagoon.yml` でできることはまだたくさんあります。詳細は [`.lagoon.yml` についてのドキュメンテーション](../concepts-basics/lagoon-yml.md) をご覧ください。

## Drupal特有のセットアップ

DrupalサイトをLagoonに移行する場合、全てをセットアップするためにいくつかDrupal特有のタスクを完了する必要があります。

### 設定ファイル

次のステップは、設定ファイルを更新することです。Lagoonは、環境変数を使用する環境特有の設定ファイルのセットを使用するため、これらのファイルには機密情報は保存されず、全てがコミット可能で安全です。我々はさまざまな [私たちの例のリポジトリ](https://github.com/uselagoon/lagoon-examples)にあるさまざまな例のプロジェクト - もし初めての場合は、それらの一つを使用することをお勧めします。そうでない場合は、似たようなものを選んで関連する設定ファイルをコピーしてください。[環境変数に関するドキュメンテーションを確認してください](../concepts-advanced/environment-variables.md)。それらをどのように使用するかの詳細情報を得るために。

例のリポジトリから設定ファイルをコピーし、その後、あなたのサイトが使用していないサービスの設定を削除するためにそれを確認します（例えば、すべてのサイトがSolrやRedisを使用しているわけではありません）。特定の環境タイプの設定をオーバーライドする必要がある場合（開発環境でのキャッシュを無効にするなど）、追加の設定ファイルを設定することができます（例のリポジトリにすでにいくつかあります）、そして次の順序でロードされます：

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

`.gitignore`が設定ファイルのコミットを許可するようにすることを確認してください。Drupalは `sites/*`で出荷されます `/settings*.php`および`sites/*/services*.yml`を`.gitignore`から削除します。Lagoonを使用する場合、Gitリポジトリに機密情報を保持することはありません。

### DrupalのWebrootについての注意点

残念ながら、Drupalコミュニティでは標準化されたwebrootフォルダ名についてまだ決定していません。一部のプロジェクトではDrupalを`/web`内に、他のプロジェクトでは`/docroot`または他の場所に配置します。LagoonのDrupal設定ファイルは、Drupalが`/web`内にあると想定しています。Drupalのインストールがこれと異なる場合は、ファイルを適切に調整してください。

### 画像をビルドする

まず、定義された画像をビルドする必要があります：

```bash title="build your images"
docker-compose build
```

これには数分かかる場合があり、長いレスポンスが返ってきます。[これは次のようなものになるはずです](https://gist.github.com/AlannaBurke/1bdad6aab977b0994c245834e61b6b50)。

これにより、`docker-compose.yml`で`build:`定義を持つすべてのコンテナのDockerイメージを`docker-compose`にビルドさせます。通常、Drupalでは`cli`、`nginx`、`php`が含まれます。これは、特定のビルドコマンド（`composer install`など）を実行したり、特定の環境変数（`WEBROOT`など）を画像に注入したりするためです。

通常、 Drupalのコードを編集するたびにビルドする必要はありません（コードはホストからコンテナにマウントされます）、しかし再ビルドは問題ありません。さらに、Lagoonはデプロイメント時に全く同じDockerイメージをビルドするので、`docker-compose build` を再度実行するだけで、ビルドがデプロイメント時にも正常に動作するか確認できます。

### コンテナの起動

イメージがビルドされたので、コンテナを起動できます：

```bash title="start the containers"
docker-compose up -d
```

次のような応答が表示されます：

```bash title="containers started"
➜  lagoon-test git:(main) docker-compose up -d
Recreating lagoon-test_cli_1   ... done
Starting lagoon-test_redis_1   ... done
Starting lagoon-test_solr_1    ... done
Starting lagoon-test_mariadb_1 ... done
Recreating lagoon-test_php_1   ... done
Recreating lagoon-test_nginx_1 ... done
Recreating lagoon-test_varnish_1 ... done
```

これによりすべてのコンテナが起動します。コマンドが完了した後、`docker-compose ps`で確認して、すべて完全に起動し、クラッシュしていないことを確認できます。その応答は次のようになるはずです：

```bash title="view running containers"
➜  lagoon-test git:(main) docker-compose ps
Name                        コマンド               状態            ポート
----------------------------------------------------------------------------------------
lagoon-test_cli_1       /sbin/tini -- /lagoon/entr ...   上      9000/tcp
lagoon-test_mariadb_1   /sbin/tini -- /lagoon/entr ...   上      0.0.0.0:32768->3306/tcp
lagoon-test_nginx_1     /sbin/tini -- /lagoon/entr ...   上      8080/tcp
lagoon-test_php_1       /sbin/tini -- /lagoon/entr ...   上      9000/tcp
lagoon-test_redis_1     /sbin/tini -- /lagoon/entr ...   上      6379/tcp
lagoon-test_solr_1      /sbin/tini -- /lagoon/entr ...   上      0.0.0.0:32769->8983/tcp
lagoon-test_varnish_1   /sbin/tini -- /lagoon/entr ...   上      8080/tcp
```

問題がある場合は、 `docker-compose logs -f [servicename]`を使用してログを確認します。

### 再度 `composer install`を実行する（Composerプロジェクトのみ）

Drupal 8+プロジェクトを実行している場合は、Composerを使用しているはずであり、すべての依存関係をダウンロードしてインストールする必要があります。cliコンテナに接続し、composer installを実行します：

```bash title="re-run composer install"
docker-compose exec cli bash
[drupal-example]cli-drupal:/app$ composer install
```

これは奇妙に聞こえるかもしれませんが、 ビルドステップ中にすでに`composer install`が実行されていたので、再度これを行う理由を説明します：

- ホスト上のファイルを編集してコンテナ内で直ちに利用できるようにするため、デフォルトの`docker-composer.yml`は全フォルダをコンテナにマウントします（これは`volumes`セクションの`.:/app:delegated`で起こります）。これはまた、Dockerビルド中にインストールされた全ての依存関係がホスト上のファイルで上書きされることも意味します。
- ローカルでは、`composer.json`で`require-dev`として定義された依存関係にアクセスしたいと思うでしょう、一方で本番環境ではそれらは不必要なスペースを占めるだけです。そのため、Dockerfileで`composer install --no-dev`を実行し、手動で`composer install`を行います。

すべてがうまくいった場合、`docker-compose.yml`で定義された`LAGOON_ROUTE`を開きます（例えば`http://drupal.docker.amazee.io`）と、素敵なDrupalエラーに迎えられるはずです。心配しないでください - 今のところそれは大丈夫です、最も重要なことはDrupalサイトをロードしようと試みることです。

500やそれに類似するエラーが出る場合は、Composerですべてが適切にロードされていることを確認してください。

### ステータスの確認とDrupalのインストール

最後にDrupalをインストールする時間ですが、その前に すべてが正常に動作することを確認したいです。そのためには、`drush status`を使ったDrushの使用をお勧めします：

```bash title="run drush status"
docker-compose exec cli bash
[drupal-example]cli-drupal:/app$ drush status
```

上記のコマンドは、以下のような結果を返すはずです：

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

!!! info ""
    次のステップに進む前に、公開鍵についてpygmyに伝える必要があるかもしれません。`Permission denied (publickey)`というエラーが表示された場合は、確認してください。 こちらでドキュメンテーションを確認してください：[pygmy - sshキーの追加](https://pygmy.readthedocs.io/en/master/usage/#adding-ssh-keys)。

次にDrupalをインストールします（代わりに既存のSQLファイルをインポートしたい場合は、次のステップに進んでください。しかし、初めにすべてが正常に動作していることを確認するために、クリーンなDrupalをインストールすることをお勧めします）。

```bash title="drush siの実行"
[drupal-example]cli-drupal:/app$ drush site-install
```
これにより、次のような出力が表示されるはずです：

```bash title="drush siの結果"
[drupal-example]cli-drupal:/app$ drush site-install
あなたは 'drupal' データベースのすべてのテーブルをDROPしようとしています。続行しますか？ (y/n): y
Drupalのインストールを開始します。これには時間がかかります。--notifyグローバルオプションの使用を検討してください。
インストール完了。ユーザー名: admin ユーザーパスワード: arbZJekcqh
おめでとうございます、Drupalをインストールしました！
```

これで、`LAGOON_ROUTE`で定義されたURLにアクセスして、新鮮できれいにインストールされたDrupalを見ることができます - おめでとうございます！

### 既存のデータベースダンプのインポート

既に存在するDrupalサイトがある場合、そのデータベースをローカルサイトにインポートしたくなるでしょう。データベースダンプを作成する方法は多数存在し、現在のホスティングプロバイダーによります。 Drushがインストールされている場合、以下のように使用できます。

```bash title="drush sql-dump"
[your-existing-site]$ drush sql-dump --result-file=dump.sql
データベースのダンプがdump.sqlに保存されました。[成功]
```

これで、あなたの全データベースを含む`dump.sql`ファイルが作成されました。
このファイルをローカルのGitリポジトリにコピーし、CLIに接続すると、その中にファイルが表示されます。

```bash title="here's our dump file"
[drupal-example] docker-compose exec cli bash
[drupal-example]cli-drupal:/app$ ls -l dump.sql
-rw-r--r--    1 root     root          5281 Dec 19 12:46 dump.sql
```
現在のデータベースをドロップした後、ダンプをインポートできます（まだCLIに接続したままです）：

```bash title="dump existing db and import dump file"
[drupal-example]cli-drupal:/app$ drush sql-drop
本当にデータベースdrupalのすべてのテーブルをドロップしますか？ (y/n): y
[drupal-example]cli-drupal:/app$ drush sql-cli < dump.sql
```

### Drupalファイルディレクトリ

Drupalサイトには、ファイルディレクトリも含まれます。既存のサイトからファイルを移行するには、ファイルを適切なフォルダに追加するだけです（おそらく`web/sites/default/files`、`sites/default/files`など）。あなたが何を設定したかを覚えておいてください。 webroot - すべてのプロジェクトで同じではないかもしれません。

## デプロイ

このガイドのすべてを行い、あなたのamazee.io管理者がすべてを設定した場合、あなたのサイトをデプロイする準備が整いました！

Drupalサイトをデプロイする場合は、[このデプロイガイドを参照してください](../applications/drupal/first-deployment-of-drupal.md)。

それ以外の全てのデプロイについては、[このデプロイガイドを参照してください](../using-lagoon-the-basics/first-deployment.md)。
