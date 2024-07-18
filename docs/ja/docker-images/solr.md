# Solr

[Lagoon `Solr`イメージのDockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/solr/8.Dockerfile)。公式の[`solr:<version>-alpine`イメージ](https://hub.docker.com/_/solr)を基にしています。

このDockerfileは、初期コア`mycore`を持つスタンドアロンのSolrサーバーをセットアップするために使用することを意図しています。

## サポートされているバージョン { #supported-versions }

* 5.5 \(互換性のために利用可能、公式サポートは終了\)
* 6.6 \(互換性のために利用可能、公式サポートは終了\)
* 7.7 \(互換性のために利用可能、公式サポートは終了\)
* 7 \(互換性のために利用可能、公式サポートは終了\) - `uselagoon/solr-7`
* 8 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/solr/8.Dockerfile) - `uselagoon/solr-8`
* 9 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/solr/9.Dockerfile) - `uselagoon/solr-9`

## Lagoonの適応 { #lagoon-adaptions }

このイメージはLagoonで使用するために準備されています。したがって、すでにいくつかのことが行われています:

* フォルダの権限は自動的に[`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions)で調整されるため、このイメージはランダムなユーザーで動作します。
* `Solr`ポートを修正し確認する`10-solr-port.sh`スクリプト。
* `20-solr-datadir.sh` `Solr`の設定がLagoonに適合しているかを確認するスクリプトです。これによりディレクトリのパスが設定され、正しいロックタイプが設定されます。

## 環境変数 { #environment-variables }

一部のオプションは[環境変数](../concepts-advanced/environment-variables.md)を通じて設定可能です。

| 環境変数                   | デフォルト  | 説明                                                                        |
| :------------------------ | :-------- | :------------------------------------------------------------------------ |
| SOLR_JAVA_MEM             | 512M      | デフォルトのJava HEAPサイズ(例. `SOLR_JAVA_MEM="-Xms10g -Xmx10g"`)。           |
| SOLR_DATA_DIR             | /var/solr | Solrのデータディレクトリのパス。注意してください、これを変更するとデータが失われる可能性があります！ |
| SOLR_COPY_DATA_DIR_SOURCE | (未設定) | Solrのエントリーポイントスクリプトが定義した`SOLR_DATA_DIR`にコピーするためのパス。これはSolrにコアを事前に準備するために使用できます。スクリプトは実際のSolrデータファイルを必要とします！また、目的地が既にSolrコアを持っていない場合にのみデータをコピーします。 |
