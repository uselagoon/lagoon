# MySQL

MySQLは人気のあるオープンソースのリレーショナルデータベース管理システム(RDBMS)です。

[Lagoonの `MySQl` イメージのDockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mysql/8.4.Dockerfile)は、公式のアップストリームdocker イメージ[`mysql`](https://hub.docker.com/_/mysql)(Oracle Linux variant)をベースに作成されています。

このDockerfileは、スタンドアロンのMariaDBデータベースサーバーをセットアップするために使用されます。

* 8.0 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mysql/8.0.Dockerfile) (2026年4月まで延長サポート) - `uselagoon/mysql-8.0`
* 8.4 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mysql/8.4.Dockerfile) (2032年4月まで延長サポート) - `uselagoon/mysql-8.4`

!!!情報
    このイメージはMariaDBイメージの完全な代替品として作られたものではありません。そのため、ローカル開発環境で動作させるにはカスタマイズが必要な場合があります。

## Lagoonの適応 { #lagoon-adaptions }

MySQLコンテナのデフォルトの公開ポートはポート`3306`です。

LagoonがMySQLコンテナの実行方法を最適に選択できるようにするには、`lagoon.type: mariadb`を使用します。これにより、DBaaSオペレーターは、クラスター内で利用可能な場合、クラウドデータベースをプロビジョニングできます。コンテナ内でMySQLを確実に実行したい場合は、`lagoon.type: mariadb-single`を使用してください。MySQLコンテナに対しては、永続ストレージが常に`/var/lib/mysql`にプロビジョニングされます。

このイメージはLagoonで使用されることを想定して準備されています。そのため、すでにいくつかのことが行われています:

* フォルダの権限は、[`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions)で自動的に適応されるため、このイメージはランダムなユーザーで動作します。
* `readiness-probe.sh` スクリプト、MariaDB コンテナの準備完了状態を確認します。

## 非Drupalプロジェクト用の`docker-compose.yml` スニペット { #docker-composeyml-snippet-for-non-drupal-projects }

```yaml title="docker-compose.yml"
	mariadb:
		image: uselagoon/mysql-8.4:latest
		labels:
		# LagoonにMariaDB互換のデータベースであることを伝える
			lagoon.type: mariadb
		ports:
			# ポート3306をランダムなローカルポートで公開し、`docker-compose port mysql 3306`でそれを見つける
			- "3306"
		volumes:
			# MySQL用のデフォルトパスに名前付きボリュームをマウントする
			- db:/var/lib/mysql
```

## Drupalプロジェクト用の`docker-compose.yml` スニペット { #docker-composeyml-snippet-for-drupal-projects }

```yaml title="docker-compose.yml"
	mariadb:
		image: uselagoon/mysql-8.4:latest
		labels:
		# LagoonにMariaDB互換のデータベースであることを伝える
			lagoon.type: mariadb
		ports:
			# ポート3306をランダムなローカルポートで公開し、`docker-compose port mysql 3306`でそれを見つける
			- "3306"
  environment:
    # LagoonでDrupalがデフォルトで期待する認証情報と一致するように、デフォルトの認証情報をオーバーライドします。
    - MYSQL_DATABASE=drupal
    - MYSQL_USER=drupal
    - MYSQL_PASSWORD=drupal
		volumes:
			# MySQL用のデフォルトパスに名前付きボリュームをマウントする
			- db:/var/lib/mysql
```

## ツール { #included-tools }

* [`mysqltuner.pl`](https://github.com/major/MySQLTuner-perl) - データベースのパラメータ調整に便利なPerlスクリプト。
* [`mysql-backup.sh`](https://github.com/uselagoon/lagoon-images/blob/main/images/mariadb/mysql-backup.sh) - 開発環境で MySQL の日次バックアップを自動化するスクリプト。
* [`pwgen`](https://linux.die.net/man/1/pwgen) - ランダムで複雑なパスワードを生成するユーティリティ。

## `my.cnf` 設定ファイル { #included-mycnf-configuration-file }

このイメージには、Lagoonで動作するように最適化された _デフォルト_ のMariaDB設定ファイルが含まれています。一部のオプションは[環境変数](../concepts-advanced/environment-variables.md)で設定可能です。

## 環境変数 { #environment-variables }

| 環境変数名                               | デフォルト             | 説明 |
| :----------------------------------- | :-------------------- | :--------------------------------------------------------------------------- |
| MYSQL_DATABASE                     | lagoon                | 起動時に作成されるデータベース名                                            |
| MYSQL_USER                         | lagoon                | 起動時に作成されるデフォルトユーザー                                             |
| MYSQL_PASSWORD                     | lagoon                | 起動時に作成されるデフォルトユーザーのパスワード                                 |
| MYSQL_ROOT_PASSWORD                | Lag00n                | MariaDBのルートユーザーのパスワード                                                |
| MYSQL_CHARSET                      | utf8mb4               | サーバーの文字セットを設定する                                                      |
| MYSQL_COLLATION                    | utf8mb4_bin           | サーバーの照合順序を設定する                                                        |
| MYSQL_MAX_ALLOWED_PACKET           | 64M                   | `max_allowed_packet`のサイズを設定する |
| MYSQL_INNODB_BUFFER_POOL_SIZE      | 256M                  | MySQL InnoDBバッファプールのサイズを設定します                                       |
| MYSQL_INNODB_BUFFER_POOL_INSTANCES | 1                     | InnoDBバッファプールインスタンスの数                                                  |
| MYSQL_INNODB_LOG_FILE_SIZE         | 64M                   | InnoDBログファイルのサイズ                                                           |
| MYSQL_LOG_SLOW                     | (設定なし)             | 遅いクエリの保存を制御する変数                                                       |
| MYSQL_LOG_QUERIES                  | (設定なし)             | すべてのクエリの保存を制御する変数                                                   |
| BACKUPS_DIR                          | /var/lib/mysql/backup | データベースのバックアップのデフォルトパス                                           |
| MYSQL_DATA_DIR                     | /var/lib/mysql        | MySQLのデータディレクトリのパス。注意してください、この値を変更するとデータ損失が発生する可能性があります！ |
| MARIADB_COPY_DATA_DIR_SOURCE         | (設定なし)             | MySQLのエントリーポイントスクリプトが、設定された`MYSQL_DATA_DIR`ディレクトリにデータをコピーする際に使用するパスについてセル名します。このパスを利用して、データベースをあらかじめMySQLに投入することができます。 ただし、スクリプトはSQLファイルではなく、実際のMySQLデータファイルの存在を前提としています。 さらに、スクリプトは、コピー先のディレクトリに既存のMySQLデータディレクトリが存在しない場合にのみ、データをコピーします。|

`LAGOON_ENVIRONMENT_TYPE` 変数が `production` に設定されている場合、パフォーマンスは `MYSQL_INNODB_BUFFER_POOL_SIZE=1024` および `MYSQL_INNODB_LOG_FILE_SIZE=256` に設定することで最適化されます。
