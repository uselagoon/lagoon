# Python

[Lagoon `python` Docker image](https://github.com/uselagoon/lagoon-images/tree/main/images/python)。これは[公式のPython Alpineイメージ](https://hub.docker.com/_/python/)に基づいています。

## サポートされているバージョン { #supported-versions }

* 2.7 \(互換性のためのみで、公式にはもうサポートされていません\) - `uselagoon/python-2.7`
* 3.7 \(互換性のためのみで、公式にはもうサポートされていません\) - `uselagoon/python-3.7`
* 3.8 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/python/3.8.Dockerfile) (2024年10月までセキュリティサポート) - `uselagoon/python-3.8`
* 3.9 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/python/3.9.Dockerfile) (2025年10月までセキュリティサポート) - `uselagoon/python-3.9`
* 3.10 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/python/3.10.Dockerfile) (2026年10月までセキュリティサポート) - `uselagoon/python-3.10`
* 3.11 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/python/3.11.Dockerfile) (2027年10月までセキュリティサポート) - `uselagoon/python-3.11`
* 3.12 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/python/3.12.Dockerfile) (2028年10月までセキュリティサポート)- `uselagoon/python-3.12`

!!! Tip "ヒント"
    私たちは通常、公式に通知されたEOL日付の後に来るLagoonリリースとともにEOL Pythonイメージの更新と公開を停止します:[https://devguide.python.org/versions/#versions](https://devguide.python.org/versions/#versions)。以前に公開されたバージョンは引き続き利用可能です。

## Lagoonの適応 { #lagoon-adaptions }

Pythonコンテナのデフォルトの公開ポートはポート`8800`です。

永続的なストレージは、`lagoon.type: python-persistent`を使用してLagoonで設定可能です。詳細については[ドキュメント](../concepts-basics/docker-compose-yml.md#persistent-storage)をご覧ください。

次のラベルを`docker-compose.yml`ファイルで使用して設定します:
`lagoon.persistent` = これを使用して、永続的なストレージとして使用するコンテナ内のパスを定義します - 例えば/app/files
`lagoon.persistent.size` = これを使用してLagoonにこのパスにどれだけのストレージを割り当てるかを伝えます。

同じストレージを共有する複数のサービスがある場合は、これを使用します
`lagoon.persistent.name` =(オプション)これを使用してLagoonに別の名前付きサービスで定義されたストレージを使用するように伝えます。

## `docker-compose.yml` スニペット { #docker-composeyml-snippet }

```yaml title="docker-compose.yml"
python:
    build:
    # これはビルドを設定します ルートフォルダにあるDockerfile
        context: .
        dockerfile: Dockerfile
    labels:
    # Lagoonにこれがpythonサービスであり、/app/filesに500MBの永続的なストレージが設定されていることを伝えます
        lagoon.type: python-persistent
        lagoon.persistent: /app/files
        lagoon.persistent.size: 500Mi
    ports:
    # ローカル開発のみ
          # 8800ポートをランダムなローカルポートで公開します
          # `docker compose port python 8800`で見つけることができます
        - "8800"
    volumes:
    # ローカル開発のみ
        # このサービスの定義されたパスで名前付きボリューム(ファイル)をマウントし、本番環境を再現します
        - files:/app/files
```
