# OpenSearch

> [_OpenSearch_](https://opensearch.org/)は、データを簡単に取り込み、検索、視覚化、分析することを可能にする、コミュニティ主導のApache 2.0ライセンスのオープンソース検索および分析スイートです。
>
> * 出典: [https://opensearch.org/](https://opensearch.org/)

## サポートされているバージョン { #supported-versions }

* 2 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/opensearch/2.Dockerfile) - `uselagoon/opensearch-2`

## 環境変数 { #environment-variables }

いくつかのオプションは[環境変数](../concepts-advanced/environment-variables.md)経由で設定可能です。

| 環境変数 | デフォルト値 | 説明 |
| :------------------- | :---------------- | :-------------------------------------------------------------------------------------------------------------------------  |
| OPENSEARCH_JAVA_OPTS | -Xms512m -Xmx512m | OpenSearchコンテナのメモリ使用量を設定します。両方の値は同じ値でなければ、OpenSearchは正常に起動しません。 |

## 既知の問題

Linuxベースのシステムでは、`vm.max_map_count`設定が低いためにOpenSearchコンテナの起動が失敗する可能性があります。 ```bash title="エラー"
opensearch_1  | エラー: [1] ブートストラップチェックが失敗しました
opensearch_1  | [1]: 最大仮想メモリエリア vm.max_map_count [65530] が低すぎます、少なくとも [262144] に増やしてください
```

[この問題の解決策はここで見つけることができます](https://opensearch.org/docs/latest/opensearch/install/important-settings/).
