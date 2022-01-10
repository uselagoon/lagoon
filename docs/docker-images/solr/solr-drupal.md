# Solr-Drupal

The [Lagoon `solr-drupal` Docker image](https://github.com/uselagoon/lagoon-images/blob/main/images/solr-drupal/7.7.Dockerfile), is a customized[`Solr` image](./) to use within Drupal projects in Lagoon.

The initial core created is `Drupal` , and it is created and configured starting from a Drupal customized and optimized configuration, copied from the [search\_api\_solr](https://www.drupal.org/project/search_api_solr) Drupal module.

The [documentation](./#lagoon-adaptions) outlines how to provide your own custom config.

For each Solr version, there is a specific `solr-drupal:<version>` Docker image.

## Supported Versions

* 5.5 \(available for compatibility, no longer officially supported\)
* 6.6 \(available for compatibility, no longer officially supported\)
* 7.7 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/solr-drupal/7.7.Dockerfile) (no longer actively supported upstream) - `uselagoon/solr-7.7-drupal`
* 7 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/solr-drupal/7.Dockerfile) - `uselagoon/solr-7-drupal`
* 7 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/solr-drupal/8.Dockerfile) - `uselagoon/solr-8-drupal`
