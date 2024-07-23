# Solr

## 標準的な使い方

Solr 5.5、6.6、および 7.7では、[search\_api\_solr](https://www.drupal.org/project/search_api_solr) Drupalモジュールによって提供されるデフォルトのスキーマファイルを提供しています。使用するSolrバージョンを[例](https://github.com/lagoon-examples/drupal-solr)のように`docker-compose.yml`ファイルに追加してください。

## カスタムスキーマ

プロジェクトでSolrのスキーマカスタマイズを実装するには、Lagoonがどのように[標準のイメージ](https://github.com/uselagoon/lagoon-images/blob/main/images/solr-drupal/8.Dockerfile)を作成するかを参照してください。

* `docker-compose.yml` ファイルの `solr` セクションで、 `image: uselagoon/solr:8` を以下のように置き換えます:

```yaml title="docker-compose.yml"
  build:
    context: .
    dockerfile: solr.dockerfile
```

* スキーマファイルをコードリポジトリに配置します。通常、`.lagoon/solr`を使用します。
* `solr.dockerfile` を作成します。

```bash title="solr.dockerfile"
FROM uselagoon/solr:8

COPY .lagoon/solr /solr-conf/conf

CMD solr-recreate drupal /solr-conf && solr-foreground
```

目標は、ビルドするイメージの`/solr-conf/conf`Solr設定ファイルが存在することです。

## マルチコア

複数のコアを実装するには、上記のように独自のSolrスキーマを用意する必要があります。必要な変更はDockerfileの`CMD`だけで、必要なコアごとに`precreate-core corename /solr-conf/ ;`のパターンを繰り返します。

```bash title="solr.dockerfile"
FROM uselagoon/solr:8-drupal

CMD solr-recreate drupal /solr-conf && solr-recreate more-drupal /solr-conf && solr-foreground
```
