# Node.js

[Lagoonの `Node.js` Dockerイメージ](https://github.com/uselagoon/lagoon-images/tree/main/images/node)です。[公式のNode Alpineイメージ](https://hub.docker.com/_/node/)をベースに作成されています。

## サポートされているバージョン { #supported-versions }

Node.jsのイメージは2つのバージョンがあります。通常の`node:version`イメージと`node:version-builder`です。

`node:version-builder`には、Node.jsアプリケーションをビルドする際に必要な追加ツール(ビルドライブラリ、npm、Yarnなど)が含まれています。詳細なリストについては、[Dockerfile](https://github.com/uselagoon/lagoon-images/tree/main/images/node-builder)を参照してください。

* 12 \(互換性のためのみ利用可能、公式サポートは終了しています\) - `uselagoon/node-12`
* 14 \(互換性のためのみ利用可能、公式サポートは終了しています\) - `uselagoon/node-14`
* 16 \(互換性のためのみ利用可能、公式サポートは終了しています\) - `uselagoon/node-16`
* 18 \(互換性のためのみ利用可能、公式サポートは終了しています\) - `uselagoon/node-18`
* 20 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/node/20.Dockerfile) (2025年4月までのセキュリティサポート) - `uselagoon/node-20`
* 22 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/node/22.Dockerfile) (2026年4月までのセキュリティサポート) - `uselagoon/node-22`

!!! Tip "ヒント"
    Lagoonは、公式にアナウンスされた終了日(EOL)の後にリリースされるバージョンで、EOLに達したNode.jsイメージの更新を停止します。詳細は[https://nodejs.org/en/about/releases/](https://nodejs.org/en/about/releases/)を参照して下さい。

## Lagoonの適応 { #lagoon-adaptions }

Node.jsコンテナのデフォルトの公開ポートはポート`3000`です。

Lagoonでは、`lagoon.type: node-persistent`を使用して、永続的なストレージを設定できます。詳細は[ドキュメント](../concepts-basics/docker-compose-yml.md#persistent-storage)を参照して下さい。

永続ストレージを設定するには、`docker-compose.yml`ファイルで以下のラベルを使用します:

* `lagoon.persistent` = コンテナ内の永続ストレージとして使用するパスを定義します - 例えば、/app/files
* `lagoon.persistent.size` = Lagoonに対し、このパスに割り当てるストレージ容量を指定します
* 同じストレージを共有する複数のサービスがある場合は、これを使用します
`lagoon.persistent.name` = (オプション)複数のサービスが同じストレージを共有する場合、別の名前付きサービスで定義されたストレージを使用するようにLagoonに指示します。

## `docker-compose.yml` スニペット { #docker-composeyml-snippet }

```yaml title="docker-compose.yml"
    node:
        build:
            # ルートフォルダにあるDockerfileからビルドを設定します
            context: .
            dockerfile: Dockerfile
        labels:
            # Lagoonに対して、Node.jsサービスであること、/app/filesに500MBの永続ストレージを設定します。
            lagoon.type: node-persistent
            lagoon.persistent: /app/files
            lagoon.persistent.size: 500Mi
        ポート:
        # ローカル開発のみ適用される設定です
            # ポート3000をランダムなローカルポートにマッピングし、
            # `docker-compose port node 3000`でポートを確認することができます。
            - "3000"
        ボリューム:
        # ローカル開発のみ適用される設定です
            # filesという名前のボリュームを定義されたパスにをマウントします。これは、本番環境と同じ状態を再現するためにローカル開発環境で利用されます。
            - files:/app/files
```

