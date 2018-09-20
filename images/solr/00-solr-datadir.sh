#!/bin/sh
set -ex

# old volume looks like this
# $corename/data/-files-
# new volume looks like this
# $corename/-files-

for datadir in `ls -d /var/solr/*` ; do
  corename=$(basename $datadir)
  if [ -d ${datadir}/data ]; then
    echo "${datadir}/data is in old format, moving to ${datadir}."
    mv ${datadir}/data/* ${datadir}/
    rm -Rf ${datadir}/data
  fi

  mkdir -p /opt/solr/server/solr/${corename}
  cp -R ${datadir}/conf /opt/solr/server/solr/${corename}/
  touch /opt/solr/server/solr/${corename}/core.properties
  sed -ibak 's/<dataDir>.*/<dataDir>\/var\/solr\/${solr.core.name}<\/dataDir>/' /opt/solr/server/solr/${corename}/conf/solrconfig.xml

done

exec solr-foreground
