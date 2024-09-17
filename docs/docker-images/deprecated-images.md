# Deprecated Images

From time to time, the Lagoon team may need to mark images as deprecated.

This is conveyed in a "sh.lagoon.image.deprecated" . It can be viewed in Docker Desktop, via a `docker inspect` command, or in future releases of Lagoon, highlighted in a build.

![Deprecated Images in a build:](../images/deprecated-images-build.png)

If the image has a suggested replacement, it will be conveyed in a "sh.lagoon.image.deprecated.suggested" label attached the deprecated image.

```shell title="docker inspect output showing deprecated image"
$ docker inspect amazeeio/mongo:latest
...
{
  ...
  "sh.lagoon.image.deprecated.status": "replaced",
  "sh.lagoon.image.deprecated.suggested": "docker.io/uselagoon/mongo-4"
}
```

## Changing the image

In all cases, changing to a suggested or updated image will require a change in your codebase. Any reference to the image in a Dockerfile, or in your docker-compose.yml will need to be updated.

## Reasons for deprecating

We have three main reasons for deprecating an image:

### Replaced
An image will be marked as "replaced" when the image reference needs to be changed. This could be because of a naming change, a repository change, or a versioning change. In these cases a new image will usually be recommended for use instead, and using it should be a fairly easy switch.

Some examples of this are:

* the migration from `amazeeio/{image}` to `uselagoon/{image}` - these images should be identical
* the versioning of an image from `uselagoon/mongo` to `uselagoon/mongo-4` - these images should be identical

### End of Life
An image will be marked as "endoflife" when the version published is no longer actively supported or maintained upstream. In these cases a new image will usually be recommended for use instead, but upgrading to it may require updating some of your application code, so should always be tested thoroughly. Also note that any suggested image may also be marked as endoflife (especially if the upstream moves quickly)

Some examples of this are:

* PHP 8.0 reached EOL in November 2023, and any `uselagoon/php-8.0-{variant}` image will suggest `uselagoon/php-8.3-{variant}` as it is the current latest release of PHP. Upgrades here _may_ be straightforward as it's within a major version.
* Python 2.7 reached EOL in January 2020, and the `uselagoon/php-2.7` images will suggest `uselagoon/python-3.12` as it is the current latest release of Python. Upgrades here will be complex, owing to it being a major version change.

### Discontinued
An image will be marked as "discontinued when the variant is no longer being published by the Lagoon team (although the upstream may still be supported). In these cases a replacement image _may_ be suggested, but any migration will be involved, and require updating of application code, client libraries, data directories etc, or removal of functionality completely.

* A CKAN variant of Python 2.7 image `uselagoon/python-2.7-ckan` stopped being published in August 2021 and no replacement is suggested.
* An AthenaPDF image `uselagoon/athenapdf-service` stopped being published in October 2022 and no replacement image is suggested.
* An Elasticsearch 7 image `uselagoon/elasticsearch-7` stopped being published in April 2023 due to licensing concerns, and although images may suggest `uselagoon/opensearch-2` - any upgrade here will be extremely involved.


## "amazeeio/" image variants

Historically, all Lagoon images were dual published to the [uselagoon](https://hub.docker.com/u/uselagoon) and [amazeeio](https://hub.docker.com/u/amazeeio) Docker Hub organizations.

In August 2024, we ceased this dual-publishing model, and have used the deprecated image tooling to suggest the correct replacements.

We encourage anyone still using the `amazeeio` variants to switch to the `uselagoon` variants as soon as possible.

As well as being easier for us to maintain, the uselagoon versions:

* Are routinely published and updated. No `amazeeio` image will be updated beyond July 2024.
* Are published as multi-architecture images by default, so will work natively on Linux, Windows or MacOS machines.
* Are free from any rate-limit restrictions, as the `uselagoon` organization is [Docker Sponsored Open Source](https://docs.docker.com/trusted-content/dsos-program/)
