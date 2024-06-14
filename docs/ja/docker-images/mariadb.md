# MariaDB

MariaDBは、オープンソースのMySQL後継者です。

[Lagoonの `MariaDB` イメージDockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mariadb/10.6.Dockerfile) は、上流のAlpineイメージが提供する公式パッケージ [`mariadb`](https://pkgs.alpinelinux.org/packages?name=mariadb&branch=edge) と [`mariadb-client`](https://pkgs.alpinelinux.org/packages?name=mariadb-client&branch=edge) をベースにしています。

このDockerfileは、スタンドアロンのMariaDBデータベースサーバを設定するために使用されることを意図しています。

* 10.4 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mariadb/10.4.Dockerfile) (Alpine 3.12 は2022年5月までサポート) - `uselagoon/mariadb-10.4`
* 10.5 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mariadb/10.5.Dockerfile) (Alpine 3.14 は2023年5月までサポート) - `uselagoon/mariadb-10.5`
* 10.6 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mariadb/10.6.Dockerfile) (Alpine 3.16 は2024年5月までサポート) - `uselagoon/mariadb-10.6`
* 10.11 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mariadb/10.11.Dockerfile) (Alpine 3.18 は2025年5月までサポート) - `uselagoon/mariadb-10.11` !!!情報
    これらのイメージは、上流のMariaDBイメージから構築されていないため、サポートは別のサイクルに従います - そして、基礎となるAlpineイメージがサポートを受けている限りのみアップデートを受けます - [https://alpinelinux.org/releases/](https://alpinelinux.org/releases/)を参照してください。実際には、ほとんどのMariaDBユーザーはこれらのコンテナをローカルで実行しています - 本番環境ではDBaaSオペレーターが提供するManaged Cloud Databasesを使用します。

## Lagoonの適応 { #lagoon-adaptions }

MariaDBコンテナのデフォルトの公開ポートはポート`3306`です。

LagoonがMariaDBコンテナを最良の方法で実行することを可能にするために、`lagoon.type: mariadb`を使用します - これにより、DBaaSオペレーターがクラスターで利用可能な場合にクラウドデータベースをプロビジョニングできます。コンテナ内のMariaDBを特にリクエストするには、`lagoon.type: mariadb-single`を使用します。永続的なストレージは、常に`/var/lib/mysql`でMariaDBコンテナに対してプロビジョニングされます。

このイメージはLagoonで使用するために準備されています。したがって、すでにいくつかのことが行われています：

* フォルダのパーミッションは自動的に[`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions)で調整されるため、このイメージは  ランダムなユーザー。
* MariaDBコンテナが準備完了したことを確認するための `readiness-probe.sh` スクリプト。

## `docker-compose.yml` スニペット { #docker-composeyml-snippet }

```yaml title="docker-compose.yml"
	mariadb:
		image: uselagoon/mariadb-10.6-drupal:latest
		labels:
		# LagoonにこれがMariaDBデータベースであることを伝える
			lagoon.type: mariadb
		ports:
			# ポート3306をランダムなローカルポートで公開し、`docker-compose port mariadb 3306`でそれを見つける
			- "3306"
		volumes:
			# 名前付きボリュームをMariaDBのデフォルトパスにマウントする
			- db:/var/lib/mysql
```

## 含まれるツール

* [`mysqltuner.pl`](https://github.com/major/MySQLTuner-perl) - データベースパラメータのチューニングに役立つPerlスクリプト。
* [`mysql-backup.sh`](https://github.com/uselagoon/lagoon-images/blob/main/images/mariadb/mysql-backup.sh) - 開発環境での日次MySQLバックアップを自動化するスクリプト。
* [`pwgen`](https://linux.die.net/man/1/pwgen) - ランダムで複雑なパスワードを生成するユーティリティ。

## 含まれる `my.cnf` 設定ファイル

このイメージには、_デフォルト_ のMariaDB設定ファイルが含まれており、Lagoonで動作するように最適化されています。一部のオプションは[環境変数](../concepts-advanced/environment-variables.md)を介して設定可能です。

## 環境変数 { #environment-variables }

| 環境 | 変数名                               | デフォルト             | 説明 |
| :----------------------------------- | :-------------------- | :--------------------------------------------------------------------------- |
| MARIADB_DATABASE                     | lagoon                | 起動時に作成されるデータベース名。                                            |
| MARIADB_USER                         | lagoon                | 起動時に作成されるデフォルトユーザー。                                             |
| MARIADB_PASSWORD                     | lagoon                | 起動時に作成されるデフォルトユーザーのパスワード。                                 |
| MARIADB_ROOT_PASSWORD                | Lag00n                | MariaDBのルートユーザーのパスワード。                                                |
| MARIADB_CHARSET                      | utf8mb4               | サーバーの文字セットを設定する。                                                      |
| MARIADB_COLLATION                    | utf8mb4_bin           | サーバーの照合順序を設定する。                                                        |
| MARIADB_MAX_ALLOWED_PACKET           | 64M                   | `max_allowed_packet`のサイズを設定する。 |
| MARIADB_INNODB_BUFFER_POOL_SIZE      | 256M                  | MariaDB InnoDBバッファプールのサイズを設定します。                                       |
| MARIADB_INNODB_BUFFER_POOL_INSTANCES | 1                     | InnoDBバッファプールインスタンスの数。                                                  |
| MARIADB_INNODB_LOG_FILE_SIZE         | 64M                   | InnoDBログファイルのサイズ。                                                           |
| MARIADB_LOG_SLOW                     | (設定なし)             | 遅いクエリの保存を制御する変数。                                                       |
| MARIADB_LOG_QUERIES                  | (設定なし)             | すべてのクエリの保存を制御する変数。                                                   |
| BACKUPS_DIR                          | /var/lib/mysql/backup | データベースのバックアップのデフォルトパス。                                           |
| MARIADB_DATA_DIR                     | /var/lib/mysql        | MariaDBのデータディレクトリのパス。注意してください、これを変更するとデータの損失が発生する可能性があります！ |
| MARIADB_COPY_DATA_DIR_SOURCE         | (設定なし)             | mariadbのエントリーポイントスクリプトが定義した`Mをコピーするために使用するパス。 `ARIADB_DATA_DIR`は、MariaDBにデータベースを事前に入れるために使用できます。このスクリプトは、sqlファイルではなく、実際のMariaDBデータファイルを期待しています！また、目的地にすでにmysqlのdatadirが存在しない場合にのみデータをコピーします。|

`LAGOON_ENVIRONMENT_TYPE`変数が`production`に設定されている場合、パフォーマンスは`MARIADB_INNODB_BUFFER_POOL_SIZE=1024`および`MARIADB_INNODB_LOG_FILE_SIZE=256`を使用して適切に設定されます。
