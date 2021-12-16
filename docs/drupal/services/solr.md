# Solr

## Standard use

For Solr 5.5, 6.6 and 7.7, we ship the default schema files provided by the [search\_api\_solr](https://www.drupal.org/project/search_api_solr) Drupal module. Add the Solr version you would like to use in your `docker-compose.yml` file, following [our example](https://github.com/amazeeio/drupal-example-simple/blob/63b3fc613260d5192b7e2dd0167c6fc85d8d9162/docker-compose.yml#L110).

## Custom schema

To implement schema customizations for Solr in your project, look to how Lagoon [creates our standard images](https://github.com/uselagoon/lagoon-images/blob/main/images/solr-drupal/7.7.Dockerfile).

* In the `solr` section of your `docker-compose.yml` file, replace `image: amazeeio/solr:7.7` with:

```yaml title="docker-compose.yml"
  build:
    context: .
    dockerfile: solr.dockerfile
```

* Place your schema files in your code repository. We typically like to use `.lagoon/solr`.
* Create a `solr.dockerfile`.

```bash title="solr.dockerfile"
FROM amazeeio/solr:7.7

COPY .lagoon/solr /solr-conf/conf

RUN precreate-core drupal /solr-conf

CMD ["solr-foreground"]
```

The goal is to have your Solr configuration files exist at `/solr-conf/conf` in the image you are building.

## Multiple cores

To implement multiple cores, you will also need to ship your own Solr schema as above. The only change needed is to the `CMD` of the Dockerfile - repeat the pattern of `precreate-core corename /solr-conf/ ;` for each core you require.

```bash title="solr.dockerfile"
FROM amazeeio/solr:7.7-drupal

RUN precreate-core drupal-index1 /solr-conf && \
    precreate-core drupal-index2 /solr-conf && \
    precreate-core drupal-index3 /solr-conf

CMD ["solr-foreground"]
```
