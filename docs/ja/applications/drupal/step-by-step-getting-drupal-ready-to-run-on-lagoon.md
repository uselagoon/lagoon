# ステップバイステップ:DrupalをLagoonで実行する準備

## 1. Lagoon Drupal 設定ファイル { #1-lagoon-drupal-setting-files }

DrupalがLagoonと連携するためには、DrupalにLagoonのことを、LagoonにDrupalのことを教える必要があります。これは、特定のYAMLとPHPファイルをGitリポジトリにコピーします。

Drupalプロジェクトに取り組んでいる場合は、[私たちの例のリポジトリ](https://github.com/uselagoon/lagoon-examples)にある様々なDrupalサンプルプロジェクトを利用できます。ニーズに合わせて Drupal 8、Drupal 9 だけでなく、データベースの種類などバリエーションも用意されています。開始するには、自分のニーズに合ったリポジトリをクローンしてください！

以下は、LagoonとDrupalに特化したファイルの概要です：

* `.lagoon.yml` - Lagoonがデプロイメントする内容などを理解するためのメインファイルです。Drupal向けの適切なデフォルト設定が用意されています。編集や変更を行う場合は、[`.lagoon.yml`のドキュメント](../../concepts-basics/lagoon-yml.md)を参照してください。
* `docker-compose.yml`、`.dockerignore`、および `*.dockerfile` \(または `Dockerfile`\) - これらのファイルはローカルのDrupal開発環境の実行に使用されます。これらのファイルは、Dockerに対して起動するサービスの種類やビルド方法を指示します。適切なデフォルト設定と、多くのコメント行が含まれています。これらのファイルは、内容が読み取れるよう十分なコメントが付けられていることを目指しています。詳細は、[`docker-compose.yml`](../../concepts-basics/docker-compose-yml.md)のドキュメントを参照ください。
* `sites/default/*` - `.php`と`.yml`のファイルは、Drupalがローカル環境と本番環境の両方でLagoonコンテナと通信する方法をDrupalに指示します。また、開発環境と本番環境で特定の設定をオーバーライド (上書き) するためのシンプルな仕組みも提供します。他のDrupalホスティングシステムとは異なり、LagoonはDrupalの設定ファイルに一切干渉しません。そのため、これらのファイルを自由に編集できます。他のファイルと同様に、適切なデフォルト設定と、一部コメント付きの部分が含まれています。
* `drush/aliases.drushrc.php` - Drush独自のファイルで、DrushがLagoonのGraphQL APIを使ってサイトエイリアス (サイトの別名) を取得する方法をDrushに指示します。
* `drush/drushrc.php` - Drushコマンド用の適切なデフォルト設定が用意されています。

### `.gitignore`設定の更新 { #update-your-gitignore-settings }

設定ファイルをコミットできるように、`.gitignore`ファイルを確認してください。

Drupalは`sites/*/settings*.php`と`sites/*/services*.yml`を`.gitignore`でコミットから除外するように初期設定されています。Lagoon 環境では機密情報は Git リポジトリに保存しないので、この除外設定を削除してください。

### Drupal 8の`WEBROOT`に関する注意事項 { #note-about-webroot-in-drupal-8 }

残念ながら、Drupalコミュニティでは`WEBROOT`フォルダ名の標準化がまだ決まっていません。Drupalを`web`ディレクトリ内に配置するプロジェクトもあれば、`docroot`や別の場所に入れるプロジェクトもあります。LagoonのDrupal設定ファイルは、Drupalが`web`ディレクトリ内に配置されていることを前提としています。もしあなたのDrupalの構成が異なる場合は、設定ファイルをそれに合わせて修正してください。

### `composer.json`に関する注意事項 { #note-about-composerjson }

Composer を使って Drupal をインストールした場合、`composer.json`を確認し、`name`が`drupal/drupal`でないことを確認してください。この名前は Drush やその他の Drupal 関連ツールと競合してしまう可能性がありますので、`myproject/drupal`など、別の名前にしてください。

## 2. `docker-compose.yml`のカスタマイズ { #2-customize-docker-composeyml }

`lagoon-project`と`LAGOON_ROUTE`の値を忘れずにカスタマイズし、サイト名とアクセスしたいURLに書き換えてください。以下に例を示します:

```yaml title="docker-compose.yml"
x-environment:
  &default-environment
    LAGOON_PROJECT: *lagoon-project
    # Route that should be used locally. If you are using pygmy, this route *must* end with .docker.amazee.io.
    LAGOON_ROUTE: http://drupal-example.docker.amazee.io
```

## 3. イメージのビルド { #3-build-images }

まず、定義されたイメージをビルドする必要があります:

```bash title="イメージをビルド"
docker-compose build
```

このコマンドを実行すると、`docker-compose.yml`内で`build:`の定義があるすべてのコンテナのDockerイメージをビルドするように`docker-compose`に指示します。通常、Drupalでは`cli`、`nginx`、`php`のイメージが該当します。これは、特定の**ビルド**コマンド(`composer install`など)を実行したり、特定の環境変数(`WEBROOT`など)をイメージに注入するためです。

通常、Drupal コードを編集するたびにビルドを行う必要はありません (コードはホストからコンテナにマウントされるため)。とはいえ、ビルドをしても何らかの問題が生じるわけではありません。さらに、Lagoon はデプロイ中にまったく同じ Docker イメージをビルドするので、`docker-compose build`コマンドをもう一度実行することで、デプロイ時にもビルドが正常に動作することを確認できます。

## 4. コンテナの起動 { #4-start-containers }

イメージがビルドされたので、コンテナを起動できます:

```bash title="コンテナを起動"
docker-compose up -d
```

これにより、すべてのコンテナが起動します。コマンドが完了した後、`docker-compose ps`ですべてのコンテナが完全に立ち上がっているか、クラッシュしていないかを確認できます。問題がある場合は、`docker-compose logs -f [servicename]`でログを確認してください。

## 5. `composer install`を再実行します（composerプロジェクトのみ） { #5-rerun-composer-install }

ローカルの開発環境では、すべての依存関係をダウンロードしてインストールしたいと思うでしょう。そのため、`cli`コンテナに接続して`composer install`を実行します:

```bash title="CLIでcomposer installを実行"
docker-compose exec cli bash
composer install
```

少し奇妙に感じるかもしれませんが、ビルド手順ですでに`composer install`が実行されているため、説明を加えさせていただきます:

* ホスト上のファイルを編集して、すぐにコンテナで利用できるようにするため、デフォルトの`docker-composer.yml`ファイルは、すべてのフォルダーをコンテナ内にマウントしています (ボリュームセクションの`.:/app:delegated`がこれに該当します)。つまり、Dockerビルド時にインストールされたすべての依存関係は、ホスト上のファイルで上書きされます。
* ローカル開発環境においては、`composer.json`で`require-dev`として定義された依存関係も存在させる必要があるでしょう。一方、本番環境では、そうした依存関係はただ無駄な容量を消費するだけです。そのため、Dockerfile内では `composer install --no-dev`を実行し、手動で`composer install`を実行します。

すべて問題なく動作している場合、`docker-compose.yml` \(例えば `http://drupal.docker.amazee.io`\)で定義された`LAGOON_ROUTE`を開くと、Drupalエラーが表示されるはずです。心配しないでください。今の段階では問題ありません。重要なのは、Drupalサイトが読み込まれようとしていることです。

500エラーや同様のエラーが発生した場合は、Composerによってすべてが正しく読み込まれたことを確認してください。

## 6. ステータスの確認とDrupalのインストール { #6-check-status-and-install-drupal }

いよいよDrupalをインストールしますが、その前にすべてが機能していることを確認したいと思います。そのためにDrushを使用することをお勧めします:

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

!!! Warning "警告"
    次のステップ前に、pygmyに公開鍵について伝える必要があるかもしれません。

`Permission denied (publickey)`のようなエラーが出た場合は、こちらからSSHキーの追加方法に関するドキュメントを参照ください: [pygmy - sshキーの追加](https://pygmy.readthedocs.io/en/master/ssh_agent)

次にDrupalをインストールします(既存のSQLファイルをインポートしたい場合は、[ステップ7へスキップ](step-by-step-getting-drupal-ready-to-run-on-lagoon.md#7-import-existing-database-dump)してください。ただし、すべてが機能することを確認するために、最初からクリーンなDrupalインストールをお勧めします。))。

```bash title="Drupalのインストール"
drush site-install
```

以下のような出力が表示されるはずです:

```bash title="drush site-install"
[drupal-example]cli-drupal:/app$ drush site-install
You are about to DROP all tables in your 'drupal' database. Do you want to continue? (y/n): y
Starting Drupal installation. This takes a while. Consider using the --notify global option.
Installation complete.  User name: admin  User password: a7kZJekcqh
Congratulations, you installed Drupal!
```

`LAGOON_ROUTE`で定義されているURLにアクセスすると、新しくインストールされたDrupalサイトが表示されます。おめでとうございます！

![おめでとう！](https://media.giphy.com/media/XreQmk7ETCak0/giphy.gif)

## 7. 既存のデータベースダンプをインポートする { #7-import-existing-database-dump }

既に既存のDrupalサイトを持っている場合、そのデータベースをローカルサイトにインポートしたいと思うでしょう。

データベースダンプを作成する方法は多数あります。現在のホスティングプロバイダーにDrushがインストールされている場合は、以下のように使用できます:

```bash title="Drush sql-dump"
drush sql-dump --result-file=dump.sql

データベースダンプはdump.sqlに保存されました
```

これで、データベース全体を含む`dump.sql`ファイルが作成されます。

このファイルをGitリポジトリにコピーし、`cli`に接続すると、その中にファイルが表示されるはずです:

```bash title="dump.sqlの表示"
[drupal-example]cli-drupal:/app$ ls -l dump.sql
-rw-r--r--    1 root     root          5281 Dec 19 12:46 dump.sql
```

現在のデータベースを削除し、ダンプをインポートできます。

```bash title="dump.sqlのインポート"
drush sql-drop

drush sql-cli < dump.sql
```

プロジェクトのURLにアクセスして、すべてが正常に動作することを確認してください。これで、Drupalサイトが正常に機能しているはずです！

## 8. Drupalファイル ディレクトリ { #8-drupal-files-directory }

Drupalサイトには、ファイルのディレクトリも必要です。このフォルダ全体はDockerコンテナ内にマウントされるため、ファイルを正しいフォルダに追加してください (おそらく`web/sites/default/files`、`sites/default/files`または同様のフォルダです)。設定した`WEBROOT`を覚えておいてください - [プロジェクトごとに異なる場合があるかもしれません](step-by-step-getting-drupal-ready-to-run-on-lagoon.md#note-about-webroot-in-drupal-8)

## 9. 完了 { #done }

ローカル設定が完了しました。Lagoon チームは、皆様の楽しい Drupaling を応援しています！
