# Solr

The [Lagoon `Solr` image Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/solr/7.7.Dockerfile). Based on the official [`solr:<version>-alpine` images](https://hub.docker.com/_/solr).

This Dockerfile is intended to be used to set up a standalone Solr server with an initial core `mycore`.

## Supported Versions

* 5.5 [\[Dockerfile\]](https://github.com/uselagoon/lagoon-images/blob/main/images/solr/5.5.Dockerfile)
* 6.6 [\[Dockerfile\]](https://github.com/uselagoon/lagoon-images/blob/main/images/solr/6.6.Dockerfile)
* 7.7 [\[Dockerfile\]](https://github.com/uselagoon/lagoon-images/blob/main/images/solr/7.7.Dockerfile)

## Lagoon adaptions

This image is prepared to be used on Lagoon. There are therefore some things already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/sclorg/s2i-base-container/blob/master/core/root/usr/bin/fix-permissions), so this image will work with a random user.
* `10-solr-port.sh` script to fix and check `Solr` port.
* `20-solr-datadir.sh` script to check if `Solr` config is compliant for Lagoon.  This sets directory paths, and configures the correct lock type.

## Environment Variables

Environment variables defined in `Solr` base image.

| Environment Variable | Default | Description |
| :--- | :--- | :--- |
| `SOLR_JAVA_MEM` | 512M | Default Java HEAP size \(ie. `SOLR_JAVA_MEM="-Xms10g -Xmx10g"` \). |
| `SOLR_DATA_DIR` | /var/solr | Path of the solr data dir, be careful, changing this can occur data loss! |
| `SOLR_COPY_DATA_DIR_SOURCE` | unset | Path which the entrypoint script of solr will use to copy into the defined `SOLR_DATA_DIR`, this can be used for prepopulating the Solr with a core. The scripts expects actual Solr data files! Plus it only copies data if the destination does not already have a solr core in it. |

