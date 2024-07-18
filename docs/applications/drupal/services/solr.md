# Solr-Drupal

## Standard use

For Solr 8 and 9, we ship the default schema files provided by the [search\_api\_solr](https://www.drupal.org/project/search_api_solr) Drupal module. Add the Solr version you would like to use in your `docker-compose.yml` file, following [our example](https://github.com/lagoon-examples/drupal-solr).

## Custom schema

To implement schema customizations for Solr in your project, look to how Lagoon [creates our standard images](https://github.com/uselagoon/lagoon-images/blob/main/images/solr-drupal/8.Dockerfile).

* In the `solr` section of your `docker-compose.yml` file, replace `image: uselagoon/solr:8` with:

```yaml title="docker-compose.yml"
  build:
    context: .
    dockerfile: solr.dockerfile
```

* Place your schema files in your code repository. We typically like to use `.lagoon/solr`.
* Create a `solr.dockerfile`.

```bash title="solr.dockerfile"
FROM uselagoon/solr:8

COPY .lagoon/solr /solr-conf/conf

CMD solr-recreate drupal /solr-conf && solr-foreground
```

The goal is to have your Solr configuration files exist at `/solr-conf/conf` in the image you are building.

## Multiple cores

To implement multiple cores, you will also need to ship your own Solr schema as above. The only change needed is to the `CMD` of the Dockerfile - repeat the pattern of `precreate-core corename /solr-conf/ ;` for each core you require.

```bash title="solr.dockerfile"
FROM uselagoon/solr:8-drupal

CMD solr-recreate drupal /solr-conf && solr-recreate more-drupal /solr-conf && solr-foreground
```
