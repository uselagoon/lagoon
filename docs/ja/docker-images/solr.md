# Solr

[Lagoon `Solr`イメージのDockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/solr/8.Dockerfile)。公式の[`solr:<version>-alpine`イメージ](https://hub.docker.com/_/solr)をベースに作成されています。

このDockerfileは、初期コア`mycore`を持つスタンドアロンのSolrサーバーをセットアップするために使用されます。

## サポートされているバージョン { #supported-versions }

* 5.5 \(互換性のためのみ利用可能、公式サポートは終了しています\)
* 6.6 \(互換性のためのみ利用可能、公式サポートは終了しています\)
* 7.7 \(互換性のためのみ利用可能、公式サポートは終了しています\)
* 7 \(互換性のためのみ利用可能、公式サポートは終了しています\) - `uselagoon/solr-7`
* 8 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/solr/8.Dockerfile) - `uselagoon/solr-8`
* 9 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/solr/9.Dockerfile) - `uselagoon/solr-9`

## Lagoonの適応 { #lagoon-adaptions }

このイメージはLagoonで使用されることを想定して準備されています。そのため、すでにいくつかのことが行われています:

* フォルダの権限は、[`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions)で自動的に適応されるため、このイメージはランダムなユーザーで動作します。
* `10-solr-port.sh`スクリプトは、`Solr`ポートの修正と確認を行います。
* `20-solr-datadir.sh`は、`Solr`の設定がLagoonに適合しているかを確認します。このスクリプトは、ディレクトリパスを設定し、正しいロックタイプを構成します。

## 環境変数 { #environment-variables }

一部のオプションは[環境変数](../concepts-advanced/environment-variables.md)を通じて設定可能です。

| 環境変数                   | デフォルト  | 説明                                                                        |
| :------------------------ | :-------- | :------------------------------------------------------------------------ |
| SOLR_JAVA_MEM             | 512M      | デフォルトのJava HEAPサイズ(例. `SOLR_JAVA_MEM="-Xms10g -Xmx10g"`)           |
| SOLR_DATA_DIR             | /var/solr | Solrデータディレクトリのパス。注意してください、これを変更するとデータが失われる可能性があります！ |
| SOLR_COPY_DATA_DIR_SOURCE | (設定なし) | 起動スクリプトが定義済みの`SOLR_DATA_DIR`にコピーするために使用するパスです。既存のコアを使って Solr を事前に設定しておくことができます。 スクリプトは実際の Solr データファイルの存在を前提としています。コピーは、宛先に Solr コアが存在しない場合のみ行われます。 |
