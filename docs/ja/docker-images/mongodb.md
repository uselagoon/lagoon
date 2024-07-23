# MongoDB

> _MongoDBは、汎用的なドキュメント型分散データベースであり、現代のアプリケーション開発者やクラウド時代のニーズに合わせて構築されています。データは JSONのような形式のドキュメントで保存されます_
>
> * 出典: [mongodb.com](https://www.mongodb.com/)

## サポートされているバージョン { #supported-versions }

4.0 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mongo/4.Dockerfile) - `uselagoon/mongo-4`

このDockerfileは、スタンドアロンのMongoDBデータベースサーバーをセットアップするために使用されます。

## Lagoonの適応 { #lagoon-adaptions }

このイメージはLagoonで使用されることを想定して準備されています。そのため、すでにいくつかのことが行われています:

* フォルダの権限は、[`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions)で自動的に適応されます。これにより、ランダムなユーザーでも動作するようにするため、KubernetesやOpenShiftでも使用できます。
