---
description: MariaDBは、オープンソースのMySQLの後継者です。
---

# MariaDB

Lagoonの `mariadb-drupal` Dockerイメージ [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mariadb-drupal/10.5.Dockerfile) は、LagoonのDrupalプロジェクト内で使用するためにカスタマイズされた [`mariadb`](../../../docker-images/mariadb.md) イメージです。 `mariadb` イメージと異なるのは、いくつかの環境変数によって行われるデータベースの初期設定だけです:

| 環境変数 | デフォルト | 説明 |
| :--- | :--- | :--- |
| `MARIADB_DATABASE` | drupal | 起動時に作成されるDrupalデータベース |
| `MARIADB_USER` | drupal | 起動時に作成されるデフォルトユーザー |
| `MARIADB_PASSWORD` | drupal | 起動時に作成されるデフォルトユーザーのパスワード |

`LAGOON_ENVIRONMENT_TYPE` 変数が `production` に設定されている場合、パフォーマンスは `MARIADB_INNODB_BUFFER_POOL_SIZE=1024` および `MARIADB_INNODB_LOG_FILE_SIZE=256` に設定することで最適化されます。

## MariaDB [ログ](../../../logging/logging.md)の追加設定

開発の過程で、クエリログまたはスロークエリログを有効にする必要があるかもしれません。そうするためには、環境変数 `MARIADB_LOG_SLOW` または `MARIADB_LOG_QUERIES` を設定します。これは`docker-compose.yml`で行うことができます.

## ホストからMySQLコンテナへの接続

[Sequel Pro](http://www.sequelpro.com/)、[MySQL Workbench](http://www.mysql.com/products/workbench/)、[HeidiSQL](http://www.heidisql.com/)、[DBeaver](http://dbeaver.jkiss.org/)、標準的な`mysql-cli`などの外部ツールを使って、Dockerコンテナ内のMySQLデータベースに接続したい場合、IPアドレスとポート情報を取得する方法を以下に示します。

### コンテナから公開された MySQL ポートを取得する

デフォルトでは、Dockerは各コンテナ起動時にMySQLの公開ポートをランダムに割り当てます。これはポートの衝突を防ぐために行われます。

`docker`を使って公開ポートを取得するには:

`docker port [container_name]`を実行

```text title="ポートを取得する"
$ docker port drupal_example_mariadb_1
3306/tcp -> 0.0.0.0:32797
```

または、Drupalリポジトリ内の`docker-compose`を使用して:

`docker-compose port [service_name] [internal_port]`を実行

```bash title="ポートを設定する"
docker-compose port mariadb 3306
0.0.0.0:32797
```

## 静的ポートの設定(非推奨)

開発中に外部のデータベースツールを使用している場合、MySQL接続ポートを常に確認し設定するのは面倒になるかもしれません。

静的ポートを設定するには、`docker-compose.yml`のサービス定義を編集します。

```yaml title="docker-compose.yml"
  mariadb:
    ...
    ports:
      - "33772:3306" # ポート3306をホストポートの33772を指定して公開します。これを行うことで、ポートの衝突を管理する責任があることに注意すること。
```

!!! Warning "警告"
    静的ポートを設定することで、ポートの衝突を管理する責任が生じます。

### MySQLへの接続

これらの詳細を使用して、お好みのデータベース管理ツールに接続できます。

|  | Linux | OS X |
| :--- | :--- | :--- |
| IP/ホスト | コンテナからのIP | `docker.amazee.io` |
| ポート | コンテナから公開されたポート | コンテナから公開されたポート |
| ユーザー名 | `drupal` | `drupal` |
| パスワード | `drupal` | `drupal` |
| データベース | `drupal` | `drupal` |

