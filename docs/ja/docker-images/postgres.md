# PostgreSQL

[Lagoon PostgreSQL Dockerイメージ](https://github.com/uselagoon/lagoon-images/blob/main/images/postgres)。[公式PostgreSQL Alpineイメージ](https://hub.docker.com/_/postgres)を基にしています。

## サポートされているバージョン { #supported-versions }

* 11 (互換性のためだけに利用可能、公式にはサポートされていません) - `uselagoon/postgres-11`
* 12 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/postgres/12.Dockerfile) (2024年11月までのセキュリティサポート) - `uselagoon/postgres-12`
* 13 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/postgres/13.Dockerfile) (2025年11月までのセキュリティサポート) - `uselagoon/postgres-13`
* 14 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/postgres/14.Dockerfile) (2026年11月までのセキュリティサポート) - `uselagoon/postgres-14`
* 15 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/postgres/15.Dockerfile) (2027年11月までのセキュリティサポート) - `uselagoon/postgres-15`
* 16 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/postgres/16.Dockerfile) (2028年11月までのセキュリティサポート) - `uselagoon/postgres-16`

!!! Tip "ヒント"
    Lagoonリリースが公式に通知されたEOL日付の後に、通常、EOL PostgreSQLイメージの更新を停止します:[https://www.postgresql.org/support/versioning](https://www.postgresql.org/support/versioning/)

## Lagoonの適応 { #lagoon-adaptions }

Postgresコンテナのデフォルトの公開ポートはポート`5432`です。

LagoonがPostgresコンテナを最適な方法で実行できるようにするためには、`lagoon.type: postgres`を使用してください。これにより、クラスタ内で利用可能な場合にDBaaSオペレータがクラウドデータベースをプロビジョニングできます。コンテナ内のPostgresを特にリクエストするには、`lagoon.type: postgres-single`を使用してください。永続的なストレージは常に、/var/lib/postgresql/dataでpostgresコンテナにプロビジョニングされます。

## `docker-compose.yml` スニペット { #docker-composeyml-snippet }

```yaml title="docker-compose.yml"
postgres:
  image: uselagoon/postgres-14-drupal:latest
  labels:
    # LagoonにこれがPostgresデータベースであることを伝える
    lagoon.type: postgres
  ports:
    # ポート5432をランダムなローカルポートで公開する
    # `docker-compose port postgres 5432`で見つけることができる
    - "5432"
  volumes:
   	# Postgresのデフォルトパスに名前付きボリュームをマウントする
    - db:/var/lib/postgresql/data
```

## ヒント＆コツ

SQLがある場合 コンテナの起動直後にデータベースを初期化するために実行する必要があるステートメントは、その `.sql` ファイルをコンテナの `docker-entrypoint-initdb.d` ディレクトリに配置できます。そのディレクトリに含まれる任意の `.sql` ファイルは、PostgreSQLコンテナを起動する一部として自動的に起動時に実行されます。

!!! Warning "警告"
    これらのスクリプトは、コンテナが空のデータベースで開始された場合にのみ実行されます。
