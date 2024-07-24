# MariaDB

MariaDBは、MySQLの後継のオープンソースです。

[Lagoonの `MariaDB` イメージのDockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mariadb/10.6.Dockerfile)は、公式のAlpineイメージで提供される [`mariadb`](https://pkgs.alpinelinux.org/packages?name=mariadb&branch=edge) と [`mariadb-client`](https://pkgs.alpinelinux.org/packages?name=mariadb-client&branch=edge) パッケージをベースにしています。

このDockerfileは、スタンドアロンのMariaDBデータベースサーバーをセットアップするために使用されます。

* 10.4 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mariadb/10.4.Dockerfile) (Alpine 3.12 は2022年5月までサポート) - `uselagoon/mariadb-10.4`
* 10.5 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mariadb/10.5.Dockerfile) (Alpine 3.14 は2023年5月までサポート) - `uselagoon/mariadb-10.5`
* 10.6 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mariadb/10.6.Dockerfile) (Alpine 3.16 は2024年5月までサポート) - `uselagoon/mariadb-10.6`
* 10.11 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mariadb/10.11.Dockerfile) (Alpine 3.18 は2025年5月までサポート) - `uselagoon/mariadb-10.11`
!!!情報
    これらのイメージは、公式のMariaDBイメージから構築されていないため、サポートサイクルが異なり、基盤となるAlpineイメージがサポートされている期間のみアップデートが提供されます。詳細は[https://alpinelinux.org/releases/](https://alpinelinux.org/releases/)を参照してください。実際にはほとんどの場合、MariaDBコンテナをローカルでのみ実行し、本番環境ではDBaaSオペレーターが提供するManaged Cloud Databasesを利用します。

## Lagoonの適応 { #lagoon-adaptions }

MariaDBコンテナのデフォルトの公開ポートはポート`3306`です。

LagoonがMariaDBコンテナの実行方法を最適に選択できるようにするには、`lagoon.type: mariadb`を使用します。これにより、DBaaSオペレーターは、クラスター内で利用可能な場合、クラウドデータベースをプロビジョニングできます。コンテナ内でMariaDBを確実に実行したい場合は、`lagoon.type: mariadb-single`を使用してください。MariaDBコンテナに対しては、永続ストレージが常に`/var/lib/mysql`にプロビジョニングされます。

このイメージはLagoonで使用されることを想定して準備されています。そのため、すでにいくつかのことが行われています:

* フォルダの権限は、[`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions)で自動的に適応されるため、このイメージはランダムなユーザーで動作します。
* `readiness-probe.sh` スクリプト、MariaDB コンテナの準備完了状態を確認します。

## `docker-compose.yml` スニペット { #docker-composeyml-snippet }

```yaml title="docker-compose.yml"
	mariadb:
		image: uselagoon/mariadb-10.6-drupal:latest
		labels:
		# LagoonにMariaDBデータベースであることを伝える
			lagoon.type: mariadb
		ports:
			# ポート3306をランダムなローカルポートで公開し、`docker-compose port mariadb 3306`でそれを見つける
			- "3306"
		volumes:
			# MariaDB用のデフォルトパスに名前付きボリュームをマウントする
			- db:/var/lib/mysql
```

## ツール { #included-tools }

* [`mysqltuner.pl`](https://github.com/major/MySQLTuner-perl) - データベースのパラメータ調整に便利なPerlスクリプト。
* [`mysql-backup.sh`](https://github.com/uselagoon/lagoon-images/blob/main/images/mariadb/mysql-backup.sh) - 開発環境で MySQL の日次バックアップを自動化するスクリプト。
* [`pwgen`](https://linux.die.net/man/1/pwgen) - ランダムで複雑なパスワードを生成するユーティリティ。

## `my.cnf` 設定ファイル { #included-mycnf-configuration-file }

このイメージには、Lagoonで動作するように最適化された _デフォルト_ のMariaDB設定ファイルが付属しています。一部のオプションは[環境変数](../concepts-advanced/environment-variables.md)で設定可能です。

## 環境変数 { #environment-variables }

| 環境変数名                               | デフォルト             | 説明 |
| :----------------------------------- | :-------------------- | :--------------------------------------------------------------------------- |
| MARIADB_DATABASE                     | lagoon                | 起動時に作成されるデータベース名                                            |
| MARIADB_USER                         | lagoon                | 起動時に作成されるデフォルトユーザー                                             |
| MARIADB_PASSWORD                     | lagoon                | 起動時に作成されるデフォルトユーザーのパスワード                                 |
| MARIADB_ROOT_PASSWORD                | Lag00n                | MariaDBのルートユーザーのパスワード                                                |
| MARIADB_CHARSET                      | utf8mb4               | サーバーの文字セットを設定する                                                      |
| MARIADB_COLLATION                    | utf8mb4_bin           | サーバーの照合順序を設定する                                                        |
| MARIADB_MAX_ALLOWED_PACKET           | 64M                   | `max_allowed_packet`のサイズを設定する |
| MARIADB_INNODB_BUFFER_POOL_SIZE      | 256M                  | MariaDB InnoDBバッファプールのサイズを設定します                                       |
| MARIADB_INNODB_BUFFER_POOL_INSTANCES | 1                     | InnoDBバッファプールインスタンスの数                                                  |
| MARIADB_INNODB_LOG_FILE_SIZE         | 64M                   | InnoDBログファイルのサイズ                                                           |
| MARIADB_LOG_SLOW                     | (設定なし)             | 遅いクエリの保存を制御する変数                                                       |
| MARIADB_LOG_QUERIES                  | (設定なし)             | すべてのクエリの保存を制御する変数                                                   |
| BACKUPS_DIR                          | /var/lib/mysql/backup | データベースのバックアップのデフォルトパス                                           |
| MARIADB_DATA_DIR                     | /var/lib/mysql        | MariaDBのデータディレクトリのパス。注意してください、この値を変更するとデータ損失が発生する可能性があります！ |
| MARIADB_COPY_DATA_DIR_SOURCE         | (設定なし)             | Mariadbのエントリーポイントスクリプトが、設定された`ARIADB_DATA_DIR`ディレクトリにデータをコピーする際に使用するパスについてセル名します。このパスを利用して、データベースをあらかじめMariaDBに投入することができます。 ただし、スクリプトはSQLファイルではなく、実際のMariaDBデータファイルの存在を前提としています。 さらに、スクリプトは、コピー先のディレクトリに既存のMySQLデータディレクトリが存在しない場合にのみ、データをコピーします。|

`LAGOON_ENVIRONMENT_TYPE` 変数が `production` に設定されている場合、パフォーマンスは `MARIADB_INNODB_BUFFER_POOL_SIZE=1024` および `MARIADB_INNODB_LOG_FILE_SIZE=256` に設定することで最適化されます。
