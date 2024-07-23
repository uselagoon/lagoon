# RabbitMQ

[Lagoon RabbitMQ Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/rabbitmq/Dockerfile)で、管理プラグインがインストールされています。[docker-hub](https://hub.docker.com/_/rabbitmq)にある公式の`rabbitmq:3-management`イメージをベースにしています。

このDockerfileは、スタンドアロンのRabbitMQキューブローカーをセットアップするためだけでなく、デフォルトで高可用性キューサポート([ミラーリングキュー](https://www.rabbitmq.com/ha.html))を備えたクラスタをセットアップするためのベースイメージとしても使用できます。

デフォルトでは、RabbitMQブローカーはシングルノードで起動します。クラスタを起動する場合は、`rabbitmq`イメージに加えて`rabbitmq_peer_discovery_k8s`プラグインが組み込まれた[`rabbitmq-cluster`](https://github.com/uselagoon/lagoon-images/blob/main/images/rabbitmq-cluster/Dockerfile) Dockerイメージを使用する必要があります。

## サポートされるバージョン

* 3.10 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/rabbitmq/Dockerfile) (2023年7月までセキュリティサポート) - `uselagoon/rabbitmq`

## Lagoonの適応 { #lagoon-adaptions }

このイメージはLagoonで使用されることを想定して準備されています。そのため、すでにいくつかのことが行われています:

* フォルダの権限は、[`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions)で自動的に適応されるため、このイメージはランダムなユーザーで動作します。
* `/etc/rabbitmq/definitions.json`は、コンテナエントリーポイントを持つ[`envplate`](https://github.com/kreuzwerker/envplate)を通して処理されます。

## RabbitMQデフォルトスキーマ(definitions.json)

* ミラーリングキューのサポートするには、少なくとも一つの[`policy`](https://www.rabbitmq.com/parameters.html#policies)が必要です。
* `definitions.json`スキーマファイルには、コンテナの実行、`virtualhost`(`vhost`)、管理UIにアクセスするための`username`、`password`、`permissions`、`policies`を設定するための最小限のエンティティが定義されています。

デフォルトでは、起動時に`lagoon-ha`という名前のポリシーが作成されますが、デフォルトの[環境変数](rabbitmq.md#environment-variables)で設定されているキュー名のパターンに一致しないため、アクティブではありません。

```javascript title="definitions.json"
"policies":[
        {"vhost":"${RABBITMQ_DEFAULT_VHOST}","name":"lagoon-ha","pattern":"${RABBITMQ_DEFAULT_HA_PATTERN}", "definition":{"ha-mode":"exactly","ha-params":2,"ha-sync-mode":"automatic","ha-sync-batch-size":5}}
  ]
```

デフォルトでは、`ha-mode`は`exactly`に設定されており、キュー(mirrors)のミラーリングノードの正確な数を制御します。ノードの数は `ha-params` で制御されます。

詳細な情報やカスタム設定については、[公式の RabbitMQ ドキュメント](https://www.rabbitmq.com/ha.html)を参照してください。

## 環境変数 { #environment-variables }

いくつかのオプションは[環境変数](../concepts-advanced/environment-variables.md)で設定可能です。

| 環境変数                   | デフォルト | 説明                                       |
| :------------------------- | :--------- | :---------------------------------------- |
| RABBITMQ_DEFAULT_USER      | guest      | 管理UIへのアクセス用のユーザ名           |
| RABBITMQ_DEFAULT_PASS      | guest      | 管理UIへのアクセス用のパスワード         |
| RABBITMQ_DEFAULT_VHOST     | /          | RabbitMQのメインの仮想ホスト             |
| RABBITMQ_DEFAULT_HA_PATTERN| ^$         | ミラーリングされたキューを一致させるための正規表現     |
