# Node.js

[Lagoonの `Node.js` Dockerイメージ](https://github.com/uselagoon/lagoon-images/tree/main/images/node)です。[公式のNode Alpineイメージ](https://hub.docker.com/_/node/)を基に作成しています。

## サポートされているバージョン

Node.jsのイメージは2つのバージョンを提供しています：通常の `node:version` イメージと `node:version-builder`。

これらのイメージのビルダーバリアントには、Node.jsのアプリをビルドする際に必要な追加のツール（ビルドライブラリ、npm、Yarnなど）が含まれています。完全なリストについては、[Dockerfile](https://github.com/uselagoon/lagoon-images/tree/main/images/node-builder)をご覧ください。

* 12（互換性のためだけに利用可能、公式にはサポートされていません）- `uselagoon/node-12`
* 14（互換性のためだけに利用可能、公式にはサポートされていません）- `uselagoon/node-14`
* 16（互換性のためだけに利用可能、公式にはサポートされていません）- `uselagoon/node-16`
* 18 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/node/18.Dockerfile) (2025年4月までのセキュリティサポート) - `uselagoon/node-18`
* 20 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/node/20.Dockerfile) (2026年4月までのセキュリティサポート) - `uselagoon/node-20`

!!! ヒント EOL Node.jsイメージの更新は通常、公式に発表されたEOL日付の後にリリースされるLagoonリリースと共に停止します：[https://nodejs.org/en/about/releases/](https://nodejs.org/en/about/releases/).

## Lagoonの適応

Node.jsコンテナのデフォルトの公開ポートはポート`3000`です。

永続的なストレージは、`lagoon.type: node-persistent`を使用してLagoonで設定可能です。詳しくは[ドキュメンテーション](../concepts-basics/docker-compose-yml.md#persistent-storage)をご覧ください。

次のラベルを`docker-compose.yml`ファイルで設定します：

* `lagoon.persistent` = これを使用して、コンテナ内で永続的なストレージとして使用するパスを定義します - 例えば、/app/files。
* `lagoon.persistent.size` = これを使用して、Lagoonにこのパスに割り当てるストレージの量を通知します。
* 同じストレージを共有する複数のサービスがある場合は、これを使用します
`lagoon.persistent.name` = （オプション）これを使用して、Lagoonに他の名前付きサービスで定義されたストレージを使用するように指示します。

## `docker-compose.yml`スニペット

```yaml title="docker-compose.yml"
    node:
        build:
            # これはルートフォルダーのDockerfileからビルドを設定します
            context: .
            dockerfile: Dockerfile
        labels:
            # このテキストはLagoonに対して、/app/filesに500MBの永続的なストレージを持つノードサービスとして設定されていることを伝えています。
            lagoon.type: node-persistent
            lagoon.persistent: /app/files
            lagoon.persistent.size: 500Mi
        ポート:
        # ローカル開発専用
            # ポート3000をランダムなローカルポートとして公開します
            # `docker-compose port node 3000`で探すことができます
            - "3000"
        ボリューム:
        # ローカル開発専用
            # 定義されたパスに名前付きボリューム（ファイル）をマウントして、このサービスの本番環境をレプリケートします
            - files:/app/files
```