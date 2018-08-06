#!/bin/sh

dsql () {
	drush sql-sync $1 default
}

dfiles () {
	drush rsync $1:%files default:%files
}
