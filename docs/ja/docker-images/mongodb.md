# MongoDB

> _MongoDBは、モダンなアプリケーション開発者とクラウド時代のために構築された、汎用的な、ドキュメントベースの分散データベースです。MongoDBはドキュメントデータベースであり、JSON形式のドキュメントとしてデータを格納します。_
>
> * [mongodb.com](https://www.mongodb.com/)から

## サポートされているバージョン { #supported-versions }

4.0 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mongo/4.Dockerfile) - `uselagoon/mongo-4`

このDockerfileは、スタンドアロンのMongoDBデータベースサーバーをセットアップするためのものです。

## Lagoonの適応 { #lagoon-adaptions }

このイメージはLagoonで使用するために準備されています。したがって、すでにいくつかのことが行われています:

* フォルダーの権限は自動的に[`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions)で適応されるため、このイメージはランダムなユーザーで動作し、したがってKubernetesまたはOpenShiftでも動作します。
