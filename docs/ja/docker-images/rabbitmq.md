# RabbitMQ

管理プラグインがインストールされた[Lagoon RabbitMQ Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/rabbitmq/Dockerfile)。公式の `rabbitmq:3-management` イメージに基づいています。[docker-hub](https://hub.docker.com/_/rabbitmq)でご確認いただけます。

このDockerfileは、スタンドアロンのRabbitMQキューブローカーをセットアップするため、またデフォルトで高可用性キューサポート付きのクラスタをセットアップするためのベースイメージとして使用することを目的としています（[ミラーリングキュー](https://www.rabbitmq.com/ha.html)参照）。

デフォルトでは、RabbitMQブローカーは単一ノードとして起動します。クラスタを起動する場合は、`rabbitmq`イメージに加えて`rabbitmq_peer_discovery_k8s`プラグインを使用した[`rabbitmq-cluster`](https://github.com/uselagoon/lagoon-images/blob/main/images/rabbitmq-cluster/Dockerfile) Dockerイメージを使用する必要があります。

## サポートされるバージョン

* 3.10 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/rabbitmq/Dockerfile) (2023年7月までセキュリティサポートあり) - `uselagoon/rabbitmq`

## Lagoonの適応 { #lagoon-adaptions }

このイメージはLagoonで使用するために準備されています。したがって、すでにいくつかの事項が完了しています：

* フォルダの権限は、[`fix-permissions`](https://github.com/usel agoon/lagoon-images/blob/main/images/commons/fix-permissions)、ランダムなユーザーと一緒にこのイメージが動作します。
* ファイル`/etc/rabbitmq/definitions.json`は、[`envplate`](https://github.com/kreuzwerker/envplate)を通じてパースされ、コンテナエントリーポイントになります。

## デフォルトのRabbitMQスキーマ（definitions.json）が含まれています

* ミラーリングキューのサポートを有効にするには、少なくとも一つの[`policy`](https://www.rabbitmq.com/parameters.html#policies)が存在しなければなりません。
* `definitions.json`スキーマファイルでは、コンテナの実行に必要な最小限のエンティティが定義されています： `virtualhost`（`vhost`）、`username`、管理UIへの`password`、`permissions`、`policies`。

デフォルトでは、起動時に`lagoon-ha`というポリシーが作成されますが、キューの名前パターンと一致しないためアクティブではありません（デフォルトの[環境変数](rabbitmq.md#environment-variables)を参照）。

```javascript title="definitions.json"
"policies":[
        {"vhost":"${RABBITMQ_DEFAULT_VHOST}","name":"lagoon-ha","pattern":"${RABBITMQ_DEFAULT_HA_PATTERN}", "definition":{"ha-mode":"exactly","ha-params":2,"ha-sync-mode":"automatic","ha-sync-batch-size":5}}
  ]
```

デフォルトでは、`ha-mode`は`exactly`に設定されており、これは キュー（ミラーズ）のミラーリングノードの正確な数。 ノードの数は `ha-params` で制御されます。

詳細な情報やカスタム設定については、[公式の RabbitMQ ドキュメンテーション](https://www.rabbitmq.com/ha.html)を参照してください。

## 環境変数 { #environment-variables }

いくつかのオプションは[環境変数](../concepts-advanced/environment-variables.md)を通じて設定可能です。

| 環境変数                   | デフォルト | 説明                                       |
| :------------------------- | :--------- | :---------------------------------------- |
| RABBITMQ_DEFAULT_USER      | guest      | 管理UIへのアクセス用のユーザ名。           |
| RABBITMQ_DEFAULT_PASS      | guest      | 管理UIへのアクセス用のパスワード。         |
| RABBITMQ_DEFAULT_VHOST     | /          | RabbitMQのメインの仮想ホスト。             |
| RABBITMQ_DEFAULT_HA_PATTERN| ^$         | ミラーリングキューにマッチする正規表現。     |
