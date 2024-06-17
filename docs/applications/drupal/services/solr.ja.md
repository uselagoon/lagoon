# Solr-Drupal

## 標準的な使用法

Solr 5.5、6.6、および 7.7のために、私たちは [search\_api\_solr](https://www.drupal.org/project/search_api_solr) Drupalモジュールによって提供されるデフォルトのスキーマファイルを提供しています。 `docker-compose.yml` ファイルに使用したいSolrバージョンを追加してください。[私たちの例](https://github.com/amazeeio/drupal-example-simple/blob/63b3fc613260d5192b7e2dd0167c6fc85d8d9162/docker-compose.yml#L110)に従ってください。

## カスタムスキーマ

プロジェクトでSolrのスキーマカスタマイズを実装するには、Lagoonがどのように[標準のイメージを作成するか](https://github.com/uselagoon/lagoon-images/blob/main/images/solr-drupal/7.7.Dockerfile)を参照してください。

* `docker-compose.yml` ファイルの `solr` セクションで、 `image: amazeeio/solr:7.7` を以下のように置き換えます:

```yaml title="docker-compose.yml"
  build:
    context: .
    dockerfile: solr.dockerfile
```

* スキーマファイルをコードリポジトリに配置します。私たちは通常、 `.lagoon/solr` を使用します。
* `solr.dockerfile` を作成します。

```bash title="solr.dockerfile"
FROM amazeeio/solr:7.7

COPY .lagoon/solr /solr-conf/conf

RUN precreate-core drupal /solr-conf

CMD ["solr-foreground"]
```

目標は、Solr設定ファイルが `/solr-conf/conf` に存在することです。 あなたが作成しているイメージ。

## 複数のコア

複数のコアを実装するには、上記のように自分自身のSolrスキーマを出荷する必要があります。必要な変更はDockerfileの`CMD`に対してのみで、必要なコアごとに`precreate-core corename /solr-conf/ ;`のパターンを繰り返します。

```bash title="solr.dockerfile"
FROM amazeeio/solr:7.7-drupal

RUN precreate-core drupal-index1 /solr-conf && \
    precreate-core drupal-index2 /solr-conf && \
    precreate-core drupal-index3 /solr-conf

CMD ["solr-foreground"]
```
