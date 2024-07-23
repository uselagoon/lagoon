---
description: Lagoonを使用するためのアプリケーション設定
---

# Lagoonを使用するためのアプリケーション設定

## `lagoon.yml`

Lagoonのプロジェクトレベルおよび環境レベルの設定は、リポジトリの `.lagoon.yml` ファイルで提供されています。

[`lagoon-yml.md`](../concepts-basics/lagoon-yml.md)を参照してください。

## `docker-compose.yml`

Lagoonのサービスレベルの設定は、リポジトリの`docker-compose.yml`ファイルで提供されています。特に、`lagoon.type`と関連するサービスラベルは、個々のサービスのドキュメントに記載されています。

[`docker-compose-yml.md`](../concepts-basics/docker-compose-yml.md)を参照してください。

## ストレージ

Lagoonはほとんどのサービスにストレージを提供する機能があります。Lagoon組み込みのサービスタイプには、必要なPVC、ボリュームなどを追加できる`-persistent`バリアントがあります。この設定をローカルで反映するように例を更新しました。

## データベース

Lagoonは以下のデータベース設定に対応しています:

* Mariadb - サポートされている全バージョン
* PostgreSQL - サポートされている全バージョン

### データベース・アズ・ア・サービス

Lagoonはまた、[dbaas-operator](https://github.com/amazeeio/dbaas-operator)を利用して、基盤となるマネージドデータベースサービス（例：RDS、Google Cloud Databases、Azure Database）を使用してこれらのデータベースを自動的にプロビジョニングする機能を持っています。これらのサービスがクラスタ用にプロビジョニングおよび設定されると、自動的に行われます。これらが利用できない場合は、フォールバックとしてポッドがプロビジョニングされます。

## キャッシュ

LagoonはキャッシュバックエンドとしてRedisをサポートしています。本番環境では、一部のユーザーがスケーリングを支援するために、マネージドRedisサービスをプロビジョニングしています。

## 検索

Lagoonは検索プロバイダーとしてElasticsearch、Solr、OpenSearchをサポートしています。必要に応じて外部の検索プロバイダーも設定できます。

## イングレス/ルート

Lagoonは、イングレス要件を持つサービスのルートを自動生成します。カスタムルートは、各サービスごとに `.lagoon.yml` に提供できます。

## 環境変数 { #environment-variables }

Lagoonは、ビルド時とランタイム時に環境変数を多用します。これらがアプリケーションの重要な設定(例:データベース設定/認証情報)を提供するために使用される場合、ローカルとLagoonのバージョンで同様の名前を付けることが重要です。

詳細は [environment-variables.md](../concepts-advanced/environment-variables.md)を参照してください。
