#!/bin/sh
set -ex

# old volume looks like this
# $corename/data/-files-
# new volume looks like this
# $corename/-files-

if [ -n "$(ls /var/solr)" ]; then
  for datadir in $(ls -d /var/solr/*) ; do
    corename=$(basename $datadir)
    if [ -d ${datadir}/data ]; then
      echo "${datadir}/data is in old format, moving to ${datadir}."
      # the contents of data have been moved to {datadir}/
      # the datadir now has the layout that a newly created core would.
      mv ${datadir}/data/* ${datadir}/
      # remove empty directory
      rm -Rf ${datadir}/data || mv ${datadir}/data ${datadir}/data-delete
    fi

    if [ ! -d  /opt/solr/server/solr/mycores/${corename} ]; then
      # the new place for config is in the container, in /opt/solr/server/solr/mycores/${corename}
      mkdir -p /opt/solr/server/solr/mycores/${corename}

      # construct a core from the persistent volume into the container;
      # there must be a core.properties to be recognized as a core
      # this need not be done when the entire config is properly built into the image.
      cp -R ${datadir}/conf /opt/solr/server/solr/mycores/${corename}/
      touch /opt/solr/server/solr/mycores/${corename}/core.properties

      # update datadir to point to the persistent volume.
      sed -ibak 's/<dataDir>.*/<dataDir>\/var\/solr\/${solr.core.name}<\/dataDir>/' /opt/solr/server/solr/mycores/${corename}/conf/solrconfig.xml
    fi


  done
fi
