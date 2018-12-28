#!/bin/sh
set -euo pipefail

# Previously the Solr Config and Solr Data Dir was both kept in the persistent volume:
# - Solr data: /opt/solr/server/solr/mycores/${corename}/data
# - Solr config: /opt/solr/server/solr/mycores/${corename}/config
# - Persistent Volume: /opt/solr/server/solr/mycores/
# The Solr Config was copied from the Docker Image into the Solr Config directory on the very first time solr started.
# This had the problem that if a new Solr Config was shipped in a new Docker Iamage the config was not copied again.
# Therefore there was no possibility to ship with updated configs and also the system does not follow any other
# services like nginx or php which have their configs not existing in persistent volumes and insted in Docker Images.
# The following script migrates from to the new directory structure:
# - Solr data: /var/solr/${corename}
# - Solr config: /opt/solr/server/solr/mycores/${corename}/config
# - Persistent Volume: /var/solr/
# It does:
# 1. Move folders from /var/solr/${corename}/data to /var/solr/${corename} - this is needed if the existing persistent volume is
#    mounted now to /var/solr/ but the data is still within data/
# 2. Create the folder /opt/solr/server/solr/mycores/${corename} if not existing (because there is no persistent volume mounted anymore)
#    and copy the config from the persistent storage to that folder.

if [ -n "$(ls /var/solr)" ]; then
  # Iterate through all existing solr cores
  for solrcorepath in $(ls -d /var/solr/*) ; do
    corename=$(basename $solrcorepath)
    if [ -d ${solrcorepath}/data ]; then
      echo "${solrcorepath} has it's data in deprecated location ${solrcorepath}/data, moving to ${solrcorepath}."
      # moving the  contents of /var/solr/${corename}/data to /var/solr/${corename}
      # the datadir now has the layout that a newly created core would.
      mv ${solrcorepath}/data/* ${solrcorepath}/
      # remove empty directory
      rm -Rf ${solrcorepath}/data || mv ${solrcorepath}/data ${solrcorepath}/data-delete
    fi

    # If the core has no files in /opt/solr/server/solr/mycores/${corename} this means:
    # The Docker Image did not run `precreate-core corename /solr-conf` during the Dockerfile
    # and instead is running `solr-precreate drupal corname solr-conf` as CMD of the container.
    # Create the folder and copy the config from the persistent storage over to this folder.
    if [ ! -d /opt/solr/server/solr/mycores/${corename} ]; then
      mkdir -p /opt/solr/server/solr/mycores/${corename}
      # Copy the solr config from the persistent volume in the solr home config directory
      cp -R ${solrcorepath}/conf /opt/solr/server/solr/mycores/${corename}/
      # there must be a core.properties to be recognized as a core
      touch /opt/solr/server/solr/mycores/${corename}/core.properties
    fi

    # Update the solr config with lagoon default config
    if [ -f /opt/solr/server/solr/mycores/${corename}/conf/solrconfig.xml ]; then
      # update datadir to point to the new location in the persistent volume.
      sed -ibak 's/<dataDir>.*/<dataDir>\/var\/solr\/${solr.core.name}<\/dataDir>/' /opt/solr/server/solr/mycores/${corename}/conf/solrconfig.xml
      # change lockType to none
      sed -ibak 's/<lockType>\${solr\.lock\.type:native}<\/lockType>/<lockType>${solr.lock.type:none}<\/lockType>/' /opt/solr/server/solr/mycores/${corename}/conf/solrconfig.xml
    fi
  done
else
  # if /var/solr is not existing or empty this solr container has never been started before.
  # We update the solr configs within `/solr-conf/conf` to the new lagoon default config as this one will most probably be used to create a new core
  if [ -f /solr-conf/conf/solrconfig.xml ]; then
    # update datadir to point to the new location in the persistent volume.
    sed -ibak 's/<dataDir>.*/<dataDir>\/var\/solr\/${solr.core.name}<\/dataDir>/' /solr-conf/conf/solrconfig.xml
    # change lockType to none
    sed -ibak 's/<lockType>\${solr\.lock\.type:native}<\/lockType>/<lockType>${solr.lock.type:none}<\/lockType>/' /solr-conf/conf/solrconfig.xml
  fi
fi

