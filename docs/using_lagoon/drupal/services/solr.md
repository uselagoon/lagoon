# Solr

## Standard use
  For Solr 5.5 and 6.6 we ship the default schema files provided by [search_api_solr](https://www.drupal.org/project/search_api_solr) version 8.x-1.2. Add the Solr version you would like to use in your docker-compose.yml file, following [our example](https://github.com/amazeeio/drupal-example/blob/master/docker-compose.yml#L103-L111)

## Custom schema
To implement schema customizations for Solr in your project look to how Lagoon [creates our standard images](https://github.com/amazeeio/lagoon/blob/master/images/solr-drupal/Dockerfile).

* In the `solr` section of your docker-compose file replace `image: amazeeio/solr:6.6` with:

```
  build:
    context: .
    dockerfile: solr.dockerfile
```

*  Place your schema files in your code repository, we typically like to use `.lagoon/solr`
*  Create a solr.dockerfile

```
FROM amazeeio/solr:6.6

COPY .lagoon/solr /solr-conf/conf

RUN precreate-core drupal /solr-conf

CMD ["solr-foreground"]
```

The goal is to have your solr configuration files exist at `/solr-conf/conf` in the image you are building.

## Multiple cores

To implement multiple cores, you will also need to ship your own solr schema as above, the only change needed is to the `CMD` of the Dockerfile, repeat the pattern of `precreate-core corename /solr-conf/ ;` for each core you require.

```

FROM amazeeio/solr:6.6-drupal

RUN precreate-core drupal-index1 /solr-conf && \
    precreate-core drupal-index2 /solr-conf && \
    precreate-core drupal-index3 /solr-conf

CMD ["solr-foreground"]

```
