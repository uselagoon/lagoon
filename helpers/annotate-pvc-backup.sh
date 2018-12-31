#!/bin/bash

##
## This annotates all PVCs with the name `solr` and `nginx` with appuio.ch/backup="true" in order that the restic backup system will back them up
##

oc get pvc --all-namespaces | grep solr | sed '1d' | awk '{ print $2, "--namespace", $1 }' | while read line; do oc annotate --overwrite pvc $line appuio.ch/backup="true"; done
oc get pvc --all-namespaces | grep nginx | sed '1d' | awk '{ print $2, "--namespace", $1 }' | while read line; do oc annotate --overwrite pvc $line appuio.ch/backup="true"; done

oc get --all-namespaces pod -l 'service in (cli)' | sed '1d' | awk '{ print "--namespace", $1, $2 }'  | while read line; do oc annotate --overwrite pod $line appuio.ch/backupcommand='/bin/bash -c "if [[ $MARIADB_HOST ]]; then mysqldump --events --routines --quick --add-locks --no-autocommit --single-transaction --no-create-db -h $MARIADB_HOST -u $MARIADB_USERNAME -p$MARIADB_PASSWORD $MARIADB_DATABASE; fi"'; done