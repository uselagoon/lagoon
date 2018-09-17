#!/bin/sh
set -ex

# checking legacy configs
for core in $(ls /opt/solr/server/solr/mycores/); do
  grep '<dataDir>/var/solr/${solr.core.name}</dataDir>' /opt/solr/server/solr/mycores/${core}/conf/solrconfig.xml

  if [ $? -ge 1 ]; then
    echo "${core}/conf/solrconfig.xml is missing updated dataDir path." > /dev/stderr
    echo 'please ensure your config has the exact line: <dataDir>/var/solr/${solr.core.name}</dataDir>' > /dev/stderr
    exit 2
  fi

done


# old volume looks like this
# $corename/data/-files-
# new volume looks like this
# $corename/-files-

for datadir in /var/solr/* ; do
  if [ -d ${datadir}/data ]; then
    echo "${datadir}/data is in old format, copying to ${datadir}."
    cp -Rpv ${datadir}/data/* ${datadir}/
  fi

  echo "if this core is working properly, you may delete the following files:"
  for f in conf core.properties data; do
    if [ -e ${datadir}/${f} ]; then
      echo ${datadir}/${f};
    fi
  done

done
