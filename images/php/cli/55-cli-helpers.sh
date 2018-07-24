#!/bin/sh

dsql () {
	drush sql-sync $1 default -d -v
}

dfiles () {
	drush rsync $1:%files default:%files -d -v
}
