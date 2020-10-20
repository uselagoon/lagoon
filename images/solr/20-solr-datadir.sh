#!/bin/sh
set -eo pipefail

# check if SOLR_COPY_DATA_DIR_SOURCE is set, if yes we're coping the contents of the given folder into the data dir folder
# this allows to prefill the datadir with a provided datadir (either added in a Dockerfile build, or mounted into the running container).
# This is different than just setting $SOLR_DATA_DIR to the source folder, as only /var/solr is a persistent folder, so setting
# $SOLR_DATA_DIR to another folder will make solr to not store the datadir across container restarts, while with this copy system
# the data will be prefilled and persistent across container restarts.
if [ -n "$SOLR_COPY_DATA_DIR_SOURCE" ]; then
  echo "MARIADB_COPY_DATA_DIR_SOURCE is set, start copying from source location"
  for solrcorepath in $(ls -d $SOLR_COPY_DATA_DIR_SOURCE/*/ | grep -v lost+found) ; do
      corename=$(basename $solrcorepath)
      if [ -d ${SOLR_DATA_DIR:-/var/solr}/$corename ]; then
          echo "core $corename already present in destination, skipping copying"
      else
          echo "copying datadir contents from '$SOLR_COPY_DATA_DIR_SOURCE/$corename to '${SOLR_DATA_DIR:-/var/solr}/$corename'"
          CUR_DIR=${PWD}
          mkdir ${SOLR_DATA_DIR:-/var/solr}/$corename
          cd $SOLR_COPY_DATA_DIR_SOURCE/$corename; tar cf - . | (cd ${SOLR_DATA_DIR:-/var/solr}/$corename; tar xvf -)
          cd $CUR_DIR
      fi
  done
fi

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

# It then also tries to update existing non-compatible configs inside solrconfig.xml:
# - dataDir now needs to be `<dataDir>/var/solr/${solr.core.name}</dataDir>` to point to the new persistent Volume
# - lockType needs to be `<lockType>${solr.lock.type:none}</lockType>` to prevent issues with the default file based Lock system which
#   can cause issues if the solr is not stopped correctly
# The script does that for existing configs in `/opt/solr/server/solr/mycores/${corename}/config` if that folder exists which can be on two cases:
# 1. During a docker build the solr core has already been created via `precreate-core` (which should be used now all the time)
# 2. The first part of the script has copied the config from the previous persistent volume into these folders
# If `/opt/solr/server/solr/mycores` is empty, this means the container has never been started, had no previous persistent volume and also did not
# run `precreate-core` yet, it checks if the common used folder `/solr-conf/conf/` has a config in it and tries to adapt it.
# This probably fails because of permissions issues, it will throw an error and exit.

if [ ! -n "$(ls /opt/solr/server/solr/mycores)" ]; then
  echo 'No pre-created Solr Cores found in `/opt/solr/server/solr/mycores` this probably means that your Dockerfile does not run'
  echo '  RUN precreate-core corename /solr-conf'
  echo 'within Dockerfile and instead uses'
  echo '  CMD ["solr-precreate", "corename", "/solr-conf"]'
  echo 'Please update your Dockerfile to:'
  echo '  RUN precreate-core corename /solr-conf'
  echo '  CMD ["solr-foreground"]'
  printf "\n\n"
fi

if [ -n "$(ls ${SOLR_DATA_DIR:-/var/solr})" ]; then
  # Iterate through all existing solr cores
  for solrcorepath in $(ls -d ${SOLR_DATA_DIR:-/var/solr}/*/ | grep -v lost+found) ; do
    corename=$(basename $solrcorepath)
    if [ -d ${solrcorepath}data ]; then
      echo "${solrcorepath} has it's data in deprecated location ${solrcorepath}data, moving to ${solrcorepath}."
      # moving the  contents of /var/solr/${corename}/data to /var/solr/${corename}
      # the datadir now has the layout that a newly created core would.
      mv ${solrcorepath}data/* ${solrcorepath}
      # remove empty directory
      rm -Rf ${solrcorepath}data || mv ${solrcorepath}data ${solrcorepath}data-delete
    fi

    # If the core has no files in /opt/solr/server/solr/mycores/${corename} this means:
    # The Docker Image did not run `precreate-core corename /solr-conf` during the Dockerfile
    # and instead is running `solr-precreate corname solr-conf` as CMD of the container.
    # But we already have an existing solr config from the persistent storage, we copy that over
    if [ ! -d /opt/solr/server/solr/mycores/${corename} ]; then
      mkdir -p /opt/solr/server/solr/mycores/${corename}
      # Copy the solr config from the persistent volume in the solr home config directory
      cp -R ${solrcorepath}conf /opt/solr/server/solr/mycores/${corename}/
      echo "copied pre-existing solr config from '${solrcorepath}conf' to '/opt/solr/server/solr/mycores/${corename}/conf'"
      printf "\n\n"
      # there must be a core.properties to be recognized as a core
      touch /opt/solr/server/solr/mycores/${corename}/core.properties
    fi
  done
fi

function fixConfig {
  fail=0
  if cat $1/solrconfig.xml | grep dataDir | grep -qv "<dataDir>${SOLR_DATA_DIR:-/var/solr}/\${solr.core.name}</dataDir>"; then
    echo "Found old non lagoon compatible dataDir config in solrconfig.xml:"
    cat $1/solrconfig.xml | grep dataDir
    SOLR_DATA_DIR=${SOLR_DATA_DIR:-/var/solr}
    SOLR_DATA_DIR_ESCAPED=${SOLR_DATA_DIR//\//\\/} # escapig the forward slashes with backslahes
    if [ -w $1/ ]; then
      sed -ibak "/<\!\-\-/!s/<dataDir>.*/<dataDir>$SOLR_DATA_DIR_ESCAPED\/\${solr.core.name}<\/dataDir>/" $1/solrconfig.xml
      echo "automagically updated to compatible config: "
      echo "  <dataDir>${SOLR_DATA_DIR:-/var/solr}/\${solr.core.name}</dataDir>"
      echo "Please update your solrconfig.xml to make this persistent."
    else
      echo "but no write permission to automagically change to compatible config: "
      echo "  <dataDir>${SOLR_DATA_DIR:-/var/solr}/\${solr.core.name}</dataDir>"
      echo "Please update your solrconfig.xml and commit again."
      fail=1
    fi
    printf "\n\n"
  fi
  # change lockType to none
  if cat $1/solrconfig.xml | grep lockType | grep -qv '<lockType>${solr.lock.type:none}</lockType>'; then
    echo "Found old non lagoon compatible lockType config in solrconfig.xml:"
    cat $1/solrconfig.xml | grep lockType
    if [ -w $1/ ]; then
      sed -ibak 's/<lockType>\${solr\.lock\.type:native}<\/lockType>/<lockType>${solr.lock.type:none}<\/lockType>/' $1/solrconfig.xml
      echo "automagically updated to compatible config: "
      echo '  <lockType>${solr.lock.type:none}</lockType>'
      echo "Please update your solrconfig.xml to make this persistent."
    else
      echo "but no write permission to automagically change to compatible config: "
      echo '  <lockType>${solr.lock.type:none}</lockType>'
      echo "Please update your solrconfig.xml and commit again."
      fail=1
    fi
    printf "\n\n"
  fi
  if [ "$fail" == "1" ]; then
    exit 1;
  fi
}

# check if `/opt/solr/server/solr/mycores` has cores, which means that `precreate-core` has already be called so we check the configs there
if [ -n "$(ls /opt/solr/server/solr/mycores)" ]; then
  # Iterate through all solr cores
  for solrcorepath in $(ls -d /opt/solr/server/solr/mycores/*/) ; do
    corename=$(basename $solrcorepath)
    # Check and Update the solr config with lagoon compatible config
    if [ -f /opt/solr/server/solr/mycores/${corename}/conf/solrconfig.xml ]; then
      fixConfig /opt/solr/server/solr/mycores/${corename}/conf
    fi
  done
else
  # `/opt/solr/server/solr/mycores` is empty, meaning that no `precreate-core` has been called and probably this container is started via `solr-precreate
  # We try to update the solr configs within `/solr-conf/conf` to the new lagoon default config as this one will most probably be used to create a new core
  if [ -f /solr-conf/conf/solrconfig.xml ]; then
    fixConfig /solr-conf/conf
  else
    echo "No config found in '/solr-conf/conf' and was not able to automatically update solr config to newest lagoon compatible version."
    echo "Cannot guarantee if this Solr config will work!"
  fi
fi

