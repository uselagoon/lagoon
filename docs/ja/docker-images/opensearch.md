# OpenSearch

> [_OpenSearch_](https://opensearch.org/)は、データを簡単に取り込み、検索、可視化、分析するためのコミュニティ主導のApache2.0ライセンスを採用したオープンソースの検索および分析スイートです。
>
> * 出典: [https://opensearch.org/](https://opensearch.org/)

## サポートされているバージョン { #supported-versions }

* 2 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/opensearch/2.Dockerfile) - `uselagoon/opensearch-2`

## 環境変数 { #environment-variables }

OpenSearch の一部オプションは、[環境変数](../concepts-advanced/environment-variables.md)を使用して設定できます。

| 環境変数 | デフォルト値 | 説明 |
| :------------------- | :---------------- | :-------------------------------------------------------------------------------------------------------------------------  |
| OPENSEARCH_JAVA_OPTS | -Xms512m -Xmx512m | OpenSearchコンテナのメモリ使用量を設定します。両方の値は同じ値でなければ、OpenSearchは正常に起動しません。 |

## 既知の問題

Linuxベースのシステムでは、`vm.max_map_count`設定が低いために、OpenSearchコンテナの起動が失敗することがあります。

 ```bash title="エラー"
opensearch_1  | ERROR: [1] bootstrap checks failed
opensearch_1  | [1]: max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]
```

[この問題の解決策はここで見つけることができます](https://opensearch.org/docs/latest/opensearch/install/important-settings/).
