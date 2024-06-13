---
description: MariaDBは、オープンソースのMySQLの後継者です。
---

# MariaDB-Drupal

Lagoonの `mariadb-drupal` Dockerイメージ [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mariadb-drupal/10.5.Dockerfile) は、LagoonのDrupalプロジェクト内で使用するためにカスタマイズされた [`mariadb`](../../../docker-images/mariadb.md) イメージです。 `mariadb` イメージとの違いは、初期データベースのセットアップのみで、これはいくつかの環境変数によって行われます:

| 環境変数 | デフォルト | 説明 |
| :--- | :--- | :--- |
| `MARIADB_DATABASE` | drupal | 起動時に作成されるDrupalデータベース。 |
| `MARIADB_USER` | drupal | 起動時に作成されるデフォルトのユーザー。 |
| `MARIADB_PASSWORD` | drupal | 起動時に作成されるデフォルトのユーザーのパスワード。 |

`LAGOON_ENVIRONMENT_TYPE` 変数が `production` に設定されている場合、パフォーマンスは `MARIADB_INNODB_BUFFER_POOL_SIZE=1024` および `MARIADB_INNODB_LOG_FILE_SIZE=256` を使用してそれに応じて設定されます。

## その他のMariaDB [ログ](../../../logging/logging.md)

開発の過程で、クエリログまたはスロークエリログを有効にする必要があるかもしれません。そうするためには、環境変数 `MARIADB_LOG_SLOW` または `MARIADB_LOG_QUERIES` を設定します。これは ` `docker-compose.yml`.

## ホストからMySQLコンテナへの接続

Dockerコンテナ内のMySQLデータベースに[Sequel Pro](http://www.sequelpro.com/)、[MySQL Workbench](http://www.mysql.com/products/workbench/)、[HeidiSQL](http://www.heidisql.com/)、[DBeaver](http://dbeaver.jkiss.org/)、`mysql-cli`などの外部ツールから接続したい場合、IPアドレスとポート情報を取得する方法をここに示します。

### コンテナから公開MySQLポートを取得する

デフォルトでは、Dockerは各コンテナ開始時にMySQLの公開ポートをランダムに割り当てます。これはポートの衝突を防ぐために行われます。

`docker`を使って公開ポートを取得するには：

実行：`docker port [container_name]`。

```text title="ポートを取得する"
$ docker port drupal_example_mariadb_1
3306/tcp -> 0.0.0.0:32797
```

または、Drupalリポジトリ内で`docker-compose`を使って：

実行：`docker-compose port [service_name] [internal_port]`。

```bash title="ポートを設定する"
docker-compose port mariadb 3306
0.0.0.0:32797
```

## 静的ポートの設定（非推奨）

開発中に外部のデータベースツールを使用している場合、MySQL接続ポートを常に確認し設定するのは面倒になるかもしれません。

静的ポートを設定するには、編集してください あなたの `docker-compose.yml` でのサービス定義。

```yaml title="docker-compose.yml"
  mariadb:
    ...
    ports:
      - "33772:3306" # ポート3306をホストポートの33772で公開します。これを行うことで、ポートの衝突を管理する責任があなたにあります。
```

!!! 警告
    静的ポートを設定すると、ポートの衝突を管理する責任があなたにあります。

### MySQLへの接続

これらの詳細を使用して、お好みのデータベース管理ツールに接続できます。

|  | Linux | OS X |
| :--- | :--- | :--- |
| IP/ホスト | コンテナからのIP | `docker.amazee.io` |
| ポート | コンテナから公開されたポート | コンテナから公開されたポート |
| ユーザー名 | `drupal` | `drupal` |
| パスワード | `drupal` | `drupal` |
| データベース | `drupal` | `drupal` |