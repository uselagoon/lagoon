# LagoonでのXdebugの設定

## コンテナでXdebug拡張機能を有効にする

Lagoonの基本イメージはXdebugが設定済みですが、パフォーマンス上の理由から、デフォルトでは拡張機能はロードされません。拡張機能を有効にするには、`XDEBUG_ENABLE`環境変数を`true`に設定する必要があります：

- **ローカル** (PygmyとLando)

  1.  プロジェクトがlagoon-examplesの `docker-compose.yml`ファイルをベースにしている場合、環境変数はすでに存在します。[これらの行をコメント解除してください](https://github.com/lagoon-examples/drupal10-base/blob/main/docker-compose.yml#L14-L15)。
  2.  環境変数を変更した後は、コンテナを再構築して再起動することを確認してください。
- **リモート** (dev/prod)
  1.  [Lagoon APIを使用して、実行中の環境に環境変数を追加することができます](../concepts-advanced/environment-variables.md#runtime-environment-variables-lagoon-api)。
  2.  環境変数を変更した後は、環境を再デプロイすることを確認してください。

## Xdebug拡張機能の有効化

デフォルトのXdebug設定では、セッションを開始するために拡張機能を有効化する"トリガー"が必要です。[完全なドキュメンテーションを表示することができます](https://xdebug.org/docs/step_debug#activate)。 _debugger)
デバッガを有効化するためには、以下の簡単な手順を参照してください。

### CLI

`php-cli` イメージは、Xdebugが有効になっているときには _常に_ Xdebugを有効化するように設定されています。
したがって、他に行う必要があることは何もありません。任意のPHPスクリプトを実行すると、デバッグセッションが開始されます。

### Web

[ブラウザ拡張機能をインストールする](https://xdebug.org/docs/step_debug#browser-extensions)
ことで、有効化クッキーを設定/解除します。

デバッグを開始したいウェブサイトに有効化クッキーが設定されていることを確認してください。

## PHPStormの設定

1. PHPStormはデフォルトで正しく設定されています。
2. ツールバーの“**Start Listening for PHP Debug Connections**”アイコンをクリックします。
3. ウェブページを読み込むか、Drushコマンドを実行します。
4. 初回実行時には、PHPStormがウィンドウを表示し、次の操作を求めます：
   1. パスマッピングを確認します。
   2. サーバー上でトリガーされた正しいローカルファイルを選択します。

## Visual Studio Codeの設定

1. Felix Beckerによる[PHP Debug拡張機能をインストールします](https://marketplace.visualstudio.com/items?itemName=felixfbecker.php-debug)。
2. 基本的な `launch.json` を作成するための[手順を参照します](https://marketplace.visualstudio.com/items?itemName=felixfbecker.php-debug#vs-code-configuration)。 PHP.
3. 正しいパスマッピングを追加します。典型的なDrupalサイトの例は以下の通りです：

   ```json title="launch.json"
   "pathMappings": {
     "/app": "${workspaceFolder}",
   },
   ```

4. Visual Studio Codeの**Run**タブで、
   “**Listen for Xdebug**”の隣にある緑色の矢印をクリックします。
5. ウェブページをロードするか、Drushコマンドを実行します。

## トラブルシューティング

- Xdebug拡張がロードされていることを確認します。Drupal
  サイトでこれを行う最善の方法は、PHPのステータスページを確認することです。Xdebugとそのすべての設定についてのセクションが見つかるはずです。

![phpinfo results](../images/phpinfo.png)

- 以下の設定を確認します:

| ディレクティブ          | ローカル値                               |
|:-------------------|:------------------------------------------|
| xdebug.mode        | debug                                     |
| xdebug.client_host | `host.docker.internal` または あなたのIPアドレス |
| xdebug.client_port | 9003                                      |

- 実行中のコンテナ内でXdebugのロギングを有効にします。必要なのは、ロギングを有効にするために設定された`XDEBUG_LOG`という名前の環境変数だけです。
  ログは`/tmp/xdebug.log`に保存されます。もしlagoon-examplesを使用しているなら、あなたは [いくつかの既存の行](https://github.com/lagoon-examples/drupal10-base/blob/main/docker-compose.yml#L16-L18)のコメントを外します。
- アクティベーションクッキーが設定されていることを確認します。ChromeまたはFirefoxのブラウザツールを使用して、`XDEBUG_SESSION`クッキーが設定されていることを確認できます。
- Xdebugがアクティブ化され、デバッグセッションがあなたのコンピューターで開始しようとしていることを確認します。`nc -l 9003` コマンドラインツールを使用してXdebugポートを開くことができます。すべてがPHPで正しく設定されていれば、ウェブページをロードするか、Drushコマンドを実行するとXdebug initのレスポンスが得られるはずです。
- `xdebug.client_host`が正しく設定されていることを確認します。Docker for Macでのローカルデバッグの場合、この値は`host.docker.internal`であるべきです。リモートデバッグの場合、この値はあなたのIPアドレスであるべきです。この値が正しく決定されなかった場合は、`DOCKERHOST`環境変数を設定することで上書きできます。
- Landoをローカルで使用する場合、CLIから実行されるスクリプトをデバッグするためには、まず`lando ssh`を介してCLIコンテナにSSHでログインする必要があります。`lando drush`または`lando php`を実行してもデバッグできません。

### Mac固有のトラブルシューティング

- Docker for Macのネットワーキングが壊れていないことを確認します。 ホストマシンで
  `nc -l 9003`を実行し、その後新しいターミナルウィンドウで次のように実行します。

  ```bash title="MacのDockerネットワーキングを確認"
  docker-compose run cli nc -zv host.docker.internal 9003
  ```

  次のようなメッセージが表示されます。
  `host.docker.internal (192.168.65.2:9003) open`。

## Linux 特有のトラブルシューティング

- ホスト `host.docker.internal`に接続できることを確認します。`docker`が手動で（Docker Desktopを経由せずに）インストールされている場合、このホストは解決されません。これを強制的に解決するためには、`docker-compose.yml`ファイルに追加のスニペットを挿入することができます（インストラクションは[このブログ投稿](https://medium.com/the-sensiolabs-tech-blog/how-to-use-xdebug-in-docker-phpstorm-76d998ef2534)から引用）。

  ```yaml title="Linux向けのdocker-compose.ymlの修正"
    services:
      cli:
        extra_hosts:
          host.docker.internal: host-gateway
      php:
        extra_hosts:
          host.docker.internal: host-gateway
  ```

## Xdebug 2

古いイメージを使用している場合は、まだXdebugバージョン2を使用しているかもしれません。このページのすべての情報は依然として適用されますが、一部の設定名と値は変更されています：

| v3                 | v2                    | |
|:-------------------|:----------------------|:----------------------------------------------|
| xdebug.mode        | xdebug.remote_enabled | オン                                         |
| xdebug.client_host | xdebug.remote_host    | `host.docker.internal` またはあなたのIPアドレス |
| xdebug.client_port | xdebug.remote_port    | 9000                                          |