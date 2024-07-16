# PostgreSQL

[Lagoon PostgreSQL Dockerイメージ](https://github.com/uselagoon/lagoon-images/blob/main/images/postgres)。[公式PostgreSQL Alpineイメージ](https://hub.docker.com/_/postgres)をベースに作成されています。

## サポートされているバージョン { #supported-versions }

* 11 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/postgres/11.Dockerfile) (2023年11月までのセキュリティサポート) - `uselagoon/postgres-11`
* 12 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/postgres/12.Dockerfile) (2024年11月までのセキュリティサポート) - `uselagoon/postgres-12`
* 13 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/postgres/13.Dockerfile) (2025年11月までのセキュリティサポート) - `uselagoon/postgres-13`
* 14 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/postgres/14.Dockerfile) (2026年11月までのセキュリティサポート) - `uselagoon/postgres-14`
* 15 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/postgres/15.Dockerfile) (2027年11月までのセキュリティサポート) - `uselagoon/postgres-15`
* 16 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/postgres/16.Dockerfile) (2028年11月までのセキュリティサポート) - `uselagoon/postgres-16`

!!! Tip "ヒント"
    Lagoonは、公式にアナウンスされた終了日(EOL)の後にリリースされるバージョンで、EOLに達したPostgreSQLイメージの更新を停止します。詳細は[https://www.postgresql.org/support/versioning](https://www.postgresql.org/support/versioning/)を参照して下さい。

## Lagoonの適応 { #lagoon-adaptions }

Postgresコンテナのデフォルトの公開ポートはポート`5432`です。

LagoonがPostgresコンテナの実行方法を最適に選択できるようにするには、`lagoon.type: postgres`を使用します。これにより、DBaaSオペレーターは、クラスター内で利用可能な場合、クラウドデータベースをプロビジョニングできます。コンテナ内でPostgresを確実に実行したい場合は、`lagoon.type: postgres-single`を使用してください。Postgresコンテナに対しては、永続ストレージが常に`/var/lib/postgresql/data`にプロビジョニングされます。


## `docker-compose.yml` スニペット { #docker-composeyml-snippet }

```yaml title="docker-compose.yml"
postgres:
  image: uselagoon/postgres-14-drupal:latest
  labels:
    # LagoonにPostgresのデータベースであることを伝える
    lagoon.type: postgres
  ports:
    # ポート5432をランダムなローカルポートで公開し、
    # `docker-compose port postgres 5432`で見つけることができる
    - "5432"
  volumes:
   	# Postgres用のデフォルトパスに名前付きボリュームをマウントする
    - db:/var/lib/postgresql/data
```

## ヒント＆コツ

コンテナ起動直後にデータベースを初期化するためのSQLステートメントがある場合、それらの`.sql`ファイルをコンテナの`docker-entrypoint-initdb.d`ディレクトリに配置することができます。このディレクトリにある `.sql` ファイルは、PostgreSQLコンテナの起動時に自動的に実行され、データベースの初期化処理の一部として動作します。

!!! Warning "警告"
    これらのスクリプトは、空のデータベースでコンテナが起動された場合にのみ実行されます。既存のデータベースに対しては動作しません。
