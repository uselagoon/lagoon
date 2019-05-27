#!/bin/sh

dsql () {
	drush sql-sync $1 @self
}

dfiles () {
	drush rsync $1:%files @self:%files
}
