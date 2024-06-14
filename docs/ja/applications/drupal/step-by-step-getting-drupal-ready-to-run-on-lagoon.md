# ステップバイステップ：LagoonでDrupalを実行する準備

## 1. Lagoon Drupal 設定ファイル

DrupalがLagoonと連携するためには、DrupalにLagoonのことを、LagoonにDrupalのことを教える必要があります。これは、特定のYAMLとPHPファイルをGitリポジトリにコピーすることで行われます。

Drupalプロジェクトを手がけている場合は、[私たちの例のリポジトリ](https://github.com/uselagoon/lagoon-examples)でさまざまなDrupalの例のプロジェクトをチェックできます。Drupal 8と9、さらに各々のバリアントがあります。最もニーズに合ったリポジトリをクローンして始めてください。

以下に、LagoonとDrupalに特化したファイルの概要を示します：

* `.lagoon.yml` - Lagoonが何をデプロイすべきかなどを理解するために使用される主要なファイルです。このファイルには、一部の妥当なDrupalのデフォルト設定が含まれています。編集や変更を行いたい場合は、[`.lagoon.yml`のドキュメンテーション](../../concepts-basics/lagoon-yml.md)をご覧ください。
* `docker-compose.yml`、`.dockerignore`、および `*.dockerfile` \(または `Dockerfile`\) - これらのファイルはローカルのDrupal開発環境を起動するために使用され、Dockerにどのサービスを開始し、それらをどのようにビルドするかを指示します。 次の内容を含む合理的なデフォルト設定と多くのコメント行があります。十分にコメントがつけられていて、その内容が自己説明的であることを願っています。詳しく知りたい場合は、[`docker-compose.yml`](../../concepts-basics/docker-compose-yml.md)のドキュメンテーションをご覧ください。
* `sites/default/*` - これらの`.php`と`.yml`のファイルは、DrupalがLagoonのコンテナとローカルおよび本番環境で通信する方法を指示します。また、開発環境と本番環境で特定のオーバーライドを直接的に提供します。他のDrupalホスティングシステムとは異なり、Lagoonは決してDrupalの設定ファイルをあなたのDrupalに注入しません。したがって、あなたはそれらを好きなように編集できます。他のすべてのファイルと同様に、それらには合理的なデフォルト設定といくつかのコメント部分が含まれています。
* `drush/aliases.drushrc.php` - これらのファイルはDrushに特化しており、DrushにLagoon GraphQL APIと通信し、存在するすべてのサイトエイリアスについて学ぶ方法を指示します。
* `drush/drushrc.php` - Drushコマンドのためのいくつかの合理的なデフォルト設定。

### `.gitignore`設定の更新

設定ファイルをコミットできるように、`.gitignore`を確認するのを忘れないでください。

Drupalは`sites/*/settings*.php`と`sites/*/services*.yml`を`.gitignore`で提供しています。それらを削除してください。 Lagoonでは、Gitリポジトリに機密情報を一切持っていません。

### Drupal 8の`WEBROOT`についての注意

残念ながら、Drupalコミュニティは標準化された`WEBROOT`フォルダ名について一致していません。一部のプロジェクトではDrupalを`web`内に置き、他のプロジェクトでは`docroot`や他の場所に置いています。LagoonのDrupal設定ファイルは、Drupalが`web`内にあると仮定していますが、あなたのDrupalでこれが異なる場合は、ファイルを適切に調整してください。

### `composer.json`についての注意

もしDrupalをcomposerを使ってインストールした場合は、`composer.json`を確認し、`name`が`drupal/drupal`でないことを確認してください。これはDrushやDrupalのユニバースの他のツールを混乱させる可能性があるため、それを`myproject/drupal`のようなものにリネームしてください。

## 2. `docker-compose.yml`のカスタマイズ

`lagoon-project`と`LAGOON_ROUTE`の値を忘れずにカスタマイズし、サイト固有の名前とアクセスしたいURLに書き換えてください。以下に例を示します：

```yaml title="docker-compose.yml"
x-environment:
  &default-environment
    LAGOON_PROJECT: *lagoon-project
    # Route that should be used locally. If you are using pygmy, this route *must* end with .docker.amazee.io.
    LAGOON_ROUTE: http://drupal-example.docker.amazee.io ## 3. イメージのビルド

まず、定義されたイメージをビルドする必要があります：

```bash title="イメージをビルド"
docker-compose build
```

これにより、`docker-compose.yml`内で`build:`の定義を持つすべてのコンテナのDockerイメージを`docker-compose`にビルドするよう指示します。通常、Drupalでは`cli`、`nginx`、`php`のイメージが該当します。これは、特定の**ビルド**コマンド（`composer install`など）を実行したり、特定の環境変数（`WEBROOT`など）をイメージに注入したりするためです。

通常、Drupalのコードを編集するたびにビルドする必要はありません（コードはホストからコンテナにマウントされるため）が、再ビルドしても問題ありません。さらに、Lagoonはデプロイ時にまったく同じDockerイメージをビルドするので、`docker-compose build`を再度実行するだけで、ビルドがデプロイ時にも正常に動作することを確認できます。

## 4. コンテナの起動

イメージがビルドされたので、コンテナを起動できます：

```bash title="コンテナを起動"
docker-compose up -d
```

これにより、すべてのコンテナが起動します。コマンドが完了した後、`docker-compose ps`で確認して、すべてが完全にアップしてクラッシュしていないことを確認できます。問題がある場合は、確認してください `docker-compose logs -f [servicename]`でログを確認します。

## 5. `composer install`を再実行します（Composerプロジェクトのみ）

ローカルの開発環境では、すべての依存関係がダウンロードされインストールされることを期待するでしょう、それで`cli`コンテナへ接続し`composer install`を実行します：

```bash title="CLIでcomposer installを実行"
docker-compose exec cli bash
composer install
```

これは奇妙に聞こえるかもしれません、なぜならビルドステップの間にすでに`composer install`が実行されていたからです、それで説明させてください：

* ホスト上のファイルを編集し、それらをコンテナ内で即座に利用可能にするため、デフォルトの`docker-composer.yml`は全体のフォルダをコンテナ内にマウントします（これはボリュームセクションの`.:/app:delegated`で起こります）。これはまた、Dockerビルド中にインストールされたすべての依存関係がホスト上のファイルで上書きされることを意味します。
* ローカルでは、`composer.json`で`require-dev`として定義された依存関係も存在することを期待するでしょう、一方で本番環境ではそれらは単に不必要なスペースを使用するだけです。そのため、Dockerfileで`composer install --no-dev`を実行し、`composer install`は手動で実行します。

全てがうまく行った場合、`docker-compose`で定義された`LAGOON_ROUTE`を開きます。 .yml` \(例えば `http://drupal.docker.amazee.io`\) を開いて、素敵なDrupalエラーが表示されるはずです。心配しないでください - 今のところそれは大丈夫です、最も重要なのはDrupalサイトをロードしようとしていることです。

500や類似のエラーが表示された場合は、Composerで正しくすべてがロードされていることを確認してください。

## 6. ステータスの確認とDrupalのインストール

いよいよDrupalをインストールする時間がきましたが、その前にすべてが機能していることを確認したいと思います。それにはDrushを使用することをお勧めします:

```bash title="Drush status"
docker-compose exec cli bash
drush status
```

これにより、以下のような結果が返されるはずです:

```bash title="Drush status result"
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
Drush configs        :  /home/.dr ush/drush.yml
                        /app/vendor/drush/drush/drush.yml
Drupal root          :  /app/web
Site path            :  sites/default
```

!!! 警告
    次のステップ前に、pygmyに公開鍵について伝える必要があるかもしれません。

`Permission denied (publickey)`のようなエラーが出た場合は、こちらのドキュメンテーションをご覧ください: [pygmy - sshキーの追加](https://pygmy.readthedocs.io/en/master/ssh_agent)

次にDrupalをインストールします（既存のSQLファイルをインポートしたい場合は、[ステップ7へスキップ](step-by-step-getting-drupal-ready-to-run-on-lagoon.md#7-import-existing-database-dump)してください。しかし、始めは全てが機能することを確認するために、クリーンなDrupalのインストールから始めることをお勧めします）。

```bash title="Drupalのインストール"
drush site-install
```

以下のような出力が表示されるはずです:

```bash title="drush site-install"
[drupal-example]cli-drupal:/app$ drush site-install
あなたは 'drupal' データベースの全てのテーブルをDROPしようとしています。続行しますか？ (y/n): y
Drupalのインストールを開始します。これにはしばらく時間がかかります。--notify グローバルオプションを使用することを検討してみてください。
インストール完了。ユーザー名: admin  ユーザーパスワード: a7kZJekcqh
おめでとうございます、Drupalをインストールしました！
```

これで `LAGOON_ROUTE`で定義されたURLを訪れると、新鮮でクリーンにインストールされたDrupalサイトが表示されるはずです - おめでとうございます！

![おめでとう！](https://media.giphy.com/media/XreQmk7ETCak0/giphy.gif)

## 7. 既存のデータベースダンプをインポートする

既に既存のDrupalサイトを持っている場合、そのデータベースをローカルサイトにインポートしたいと思うでしょう。

データベースダンプを作成する方法は多数あります。現在のホスティングプロバイダーにDrushがインストールされている場合は、以下のように使用できます：

```bash title="Drush sql-dump"
drush sql-dump --result-file=dump.sql

データベースダンプはdump.sqlに保存されました
```

これで、データベース全体を含む`dump.sql`ファイルが作成されます。

このファイルをGitリポジトリにコピーし、`cli`に接続すると、その中にファイルが表示されるはずです：

```bash title="dump.sqlの表示"
[drupal-example]cli-drupal:/app$ ls -l dump.sql
-rw-r--r--    1 root     root          5281 Dec 19 12:46 dump.sql
```

現在のデータベースを削除し、ダンプをインポートできます。

```bash title="dump.sqlのインポート"
drush sql-drop

drush sql-cli < dump.sql
```

プロジェクトのURLを訪れてすべてが正常に動作することを確認します。Drupalサイトの機能的なコピーができているはずです！

## 8. Drupalファイル ディレクトリ

Drupalサイトには、ファイルのディレクトリも必要です。全体のフォルダはDockerコンテナにマウントされるので、ファイルを正しいフォルダ（おそらく`web/sites/default/files`、`sites/default/files`またはそれに類似したもの）に追加してください。あなたが`WEBROOT`として設定したものを覚えておいてください - [すべてのプロジェクトで同じではないかもしれません](step-by-step-getting-drupal-ready-to-run-on-lagoon.md#note-about-webroot-in-drupal-8)。

## 9. 完了

あなたのローカルセットアップが完了しました。Lagoonチームは楽しいDrupal制作を願っています！
