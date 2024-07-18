# Solr-Drupal

## 標準的な使用法

Solr 8、および 9のために、私たちは [search\_api\_solr](https://www.drupal.org/project/search_api_solr) Drupalモジュールによって提供されるデフォルトのスキーマファイルを提供しています。 `docker-compose.yml` ファイルに使用したいSolrバージョンを追加してください。[私たちの例](https://github.com/lagoon-examples/drupal-solr)に従ってください。

## カスタムスキーマ

プロジェクトでSolrのスキーマカスタマイズを実装するには、Lagoonがどのように[標準のイメージを作成するか](https://github.com/uselagoon/lagoon-images/blob/main/images/solr-drupal/8.Dockerfile)を参照してください。

* `docker-compose.yml` ファイルの `solr` セクションで、 `image: uselagoon/solr:8` を以下のように置き換えます:

```yaml title="docker-compose.yml"
  build:
    context: .
    dockerfile: solr.dockerfile
```

* スキーマファイルをコードリポジトリに配置します。私たちは通常、 `.lagoon/solr` を使用します。
* `solr.dockerfile` を作成します。

```bash title="solr.dockerfile"
FROM uselagoon/solr:8

COPY .lagoon/solr /solr-conf/conf

CMD solr-recreate drupal /solr-conf && solr-foreground
```

目標は、Solr設定ファイルが `/solr-conf/conf` に存在することです。 あなたが作成しているイメージ。

## 複数のコア

複数のコアを実装するには、上記のように自分自身のSolrスキーマを出荷する必要があります。必要な変更はDockerfileの`CMD`に対してのみで、必要なコアごとに`precreate-core corename /solr-conf/ ;`のパターンを繰り返します。

```bash title="solr.dockerfile"
FROM uselagoon/solr:8-drupal

CMD solr-recreate drupal /solr-conf && solr-recreate more-drupal /solr-conf && solr-foreground
```
