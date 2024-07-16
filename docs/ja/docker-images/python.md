# Python

[Lagoon `python` Docker image](https://github.com/uselagoon/lagoon-images/tree/main/images/python)。これは[公式のPython Alpineイメージ](https://hub.docker.com/_/python/)をベースに作成されています。

## サポートされているバージョン { #supported-versions }

* 2.7 \(互換性のためのみ利用可能、公式サポートは終了しています\) - `uselagoon/python-2.7`
* 3.7 \(互換性のためのみ利用可能、公式サポートは終了しています\) - `uselagoon/python-3.7`
* 3.8 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/python/3.8.Dockerfile) (2024年10月までセキュリティサポート) - `uselagoon/python-3.8`
* 3.9 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/python/3.9.Dockerfile) (2025年10月までセキュリティサポート) - `uselagoon/python-3.9`
* 3.10 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/python/3.10.Dockerfile) (2026年10月までセキュリティサポート) - `uselagoon/python-3.10`
* 3.11 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/python/3.11.Dockerfile) (2027年10月までセキュリティサポート) - `uselagoon/python-3.11`
* 3.12 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/python/3.12.Dockerfile) (2028年10月までセキュリティサポート)- `uselagoon/python-3.12`

!!! Tip "ヒント"
    Lagoonは、公式にアナウンスされた終了日(EOL)の後にリリースされるバージョンで、EOLに達したPythonイメージの更新を停止します。詳細は[https://devguide.python.org/versions/#versions](https://devguide.python.org/versions/#versions)を参照して下さい。

## Lagoonの適応 { #lagoon-adaptions }

Pythonコンテナのデフォルトの公開ポートはポート`8800`です。

Lagoonでは、`lagoon.type: python-persistent`を使用して永続的なストレージを設定可能です。詳細については[ドキュメント](../concepts-basics/docker-compose-yml.md#persistent-storage)を参照ください。

永続的なストレージを設定するには、`docker-compose.yml`ファイルで以下のラベルを使用します:
`lagoon.persistent` = コンテナ内の永続ストレージとして使用するパスを定義します - 例えば/app/files
`lagoon.persistent.size` = Lagoonに対して、このパスに割り当てるストレージ容量を指定します。

同じストレージを共有する複数のサービスがある場合は、これを使用します
`lagoon.persistent.name` =(オプション)複数のサービスが同じストレージを共有する場合、別の名前付きサービスで定義されたストレージを使用するようにLagoonに指示します。

## `docker-compose.yml` スニペット { #docker-composeyml-snippet }

```yaml title="docker-compose.yml"
python:
    build:
    # ルートフォルダにあるDockerfileを使用してビルドを行うように設定します。
        context: .
        dockerfile: Dockerfile
    labels:
    # Lagoonに対し、Pythonサービスであることと、/app/filesに500MBの永続ストレージを設定します。
        lagoon.type: python-persistent
        lagoon.persistent: /app/files
        lagoon.persistent.size: 500Mi
    ports:
    # ローカル開発のみ適用される設定です
            # ポート8800をランダムなローカルポートにマッピングし、
            # `docker-compose port node 8800`でポートを確認することができます。
        - "8800"
    volumes:
    # ローカル開発のみ適用される設定です
        # filesという名前のボリュームを定義されたパスにをマウントします。これは、本番環境と同じ状態を再現するためにローカル開発環境で利用されます。
        - files:/app/files
```
