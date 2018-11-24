#!/bin/bash

##
## This annotates all PVCs with the name `solr` and `nginx` with appuio.ch/backup="true" in order that the restic backup system will back them up
##

oc get pvc --all-namespaces | grep solr | sed '1d' | awk '{ print $2, "--namespace", $1 }' | while read line; do oc annotate --overwrite pvc $line appuio.ch/backup="true"; done
oc get pvc --all-namespaces | grep nginx | sed '1d' | awk '{ print $2, "--namespace", $1 }' | while read line; do oc annotate --overwrite pvc $line appuio.ch/backup="true"; done