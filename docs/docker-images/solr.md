# Solr

The [Lagoon `Solr` image Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/solr/8.Dockerfile). Based on the official [`solr:<version>-alpine` images](https://hub.docker.com/_/solr).

This Dockerfile is intended to be used to set up a standalone Solr server with an initial core `mycore`.

## Supported Versions

* 5.5 \(available for compatibility only, no longer officially supported\)
* 6.6 \(available for compatibility only, no longer officially supported\)
* 7.7 \(available for compatibility only, no longer officially supported\)
* 7 \(available for compatibility only, no longer officially supported\) - `uselagoon/solr-7`
* 8 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/solr/8.Dockerfile) - `uselagoon/solr-8`
* 9 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/solr/9.Dockerfile) - `uselagoon/solr-9`

!!! Tip
    We stop updating and publishing EOL Solr images usually with the Lagoon release that comes after the officially communicated EOL date: [https://solr.apache.org/downloads.html](https://solr.apache.org/downloads.html). Previous versions will remain available.

## Lagoon adaptions

This image is prepared to be used on Lagoon. There are therefore some things already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions), so this image will work with a random user.
* `10-solr-port.sh` script to fix and check `Solr` port.
* `20-solr-datadir.sh` script to check if `Solr` config is compliant for Lagoon.  This sets directory paths, and configures the correct lock type.

## Environment Variables

Some options are configurable via [environment
variables](../concepts-advanced/environment-variables.md).

| Environment Variable      | Default   | Description                                                               |
| :------------------------ | :-------- | :------------------------------------------------------------------------ |
| SOLR_JAVA_MEM             | 512M      | Default Java HEAP size (ie. `SOLR_JAVA_MEM="-Xms10g -Xmx10g"`).           |
| SOLR_DATA_DIR             | /var/solr | Path of the solr data dir. Be careful, changing this can cause data loss! |
| SOLR_COPY_DATA_DIR_SOURCE | (not set) | Path which the entrypoint script of solr will use to copy into the defined `SOLR_DATA_DIR`, this can be used for prepopulating the Solr with a core. The scripts expects actual Solr data files! Plus it only copies data if the destination does not already have a solr core in it. |
