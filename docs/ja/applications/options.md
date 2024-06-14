---
description: Lagoonを使用するためのアプリケーション設定
---

# Lagoonを使用するためのアプリケーション設定

## `lagoon.yml`

Lagoonのプロジェクトレベルおよび環境レベルの設定は、リポジトリの `.lagoon.yml` ファイルに提供されています。

[`lagoon-yml.md`](../concepts-basics/lagoon-yml.md)を参照してください。

## `docker-compose.yml`

Lagoonのサービスレベルの設定は、リポジトリの`docker-compose.yml`ファイルに提供されています。特に、`lagoon.type`と関連するサービスラベルは個々のサービスで文書化されています。

[`docker-compose-yml.md`](../concepts-basics/docker-compose-yml.md)を参照してください。

## ストレージ

Lagoonは、ほとんどのサービスにストレージを提供する能力があります - 組み込みのLagoonサービスタイプには、必要なPVC、ボリュームなどを追加するための`-persistent`バリアントがあります。この設定をローカルに反映するように例を更新しました。

## データベース

Lagoonは以下の設定を利用できます:

* Mariadb - すべてのサポートされているバージョン
* PostgreSQL - すべてのサポートされているバージョン

### データベース・アズ・ア・サービス

Lagoonはまた、[dbaas-operator](https://github.com/amazeeio/dbaas-operator)を利用して、これらのデータベースを自動的にプロビジョニングする能力もあります。 管理データベースサービス(例:RDS、Google Cloud Databases、Azure Database)があります。これらのサービスがクラスターにプロビジョニングされ、設定されると自動的にこれらが利用されます。これらが利用できない場合、フォールバックとしてポッドがプロビジョニングされます。

## キャッシュ

Lagoonは、キャッシュバックエンドとしてRedisをサポートしています。本番環境では、一部のユーザーがスケールを助けるために、本番環境用の管理されたRedisサービスをプロビジョニングします。

## 検索

Lagoonは、Elasticsearch、Solr、OpenSearchを検索プロバイダとしてサポートしています。必要に応じて、外部検索プロバイダも設定できます。

## イングレス/ルート

Lagoonは、イングレス要件を持つサービスのルートを自動生成します。カスタムルートは、各サービスごとに `.lagoon.yml` に提供できます。

## 環境変数 { #environment-variables }

Lagoonは、ビルド時とランタイム時に環境変数を多用します。これらがアプリケーションの重要な設定(例:データベース設定/資格情報)を提供するために使用される場合、ローカルバージョンとLagoonバージョンが同様に名付けられていることが重要です。

詳細は [environment-variables.md](../concepts-advanced/environment-variables.md)を参照してください。
