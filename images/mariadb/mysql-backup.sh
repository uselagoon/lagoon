#!/bin/sh
#==============================================================================
#TITLE:            mysql_backup.sh
#DESCRIPTION:      script for automating the daily mysql backups on development computer
#AUTHOR:           tleish
#DATE:             2013-12-20
#VERSION:          0.4
#USAGE:            ./mysql_backup.sh
#CRON:
  # example cron for daily db backup @ 9:15 am
  # min  hr mday month wday command
  # 15   9  *    *     *    /Users/[your user name]/scripts/mysql_backup.sh

#RESTORE FROM BACKUP
  #$ gunzip < [backupfile.sql.gz] | mysql -u [uname] -p[pass] [dbname]

#==============================================================================
# CUSTOM SETTINGS
#==============================================================================

set -eu -o pipefail

# directory to put the backup files
BACKUP_DIR=/var/lib/mysql/backup

# MYSQL Parameters
MYSQL_USER=${MYSQL_USER:-lagoon}
MYSQL_PASSWORD=${MYSQL_PASSWORD:-lagoon}

MYSQL_HOST=$1

# Don't backup databases with these names
# Example: starts with mysql (^mysql) or ends with _schema (_schema$)
IGNORE_DB="(^mysql|_schema$)"

# Number of days to keep backups
KEEP_BACKUPS_FOR=4 #days

#==============================================================================
# METHODS
#==============================================================================

# YYYY-MM-DD_HH:MM:SS
TIMESTAMP=$(date +%F_%T)

function prepare()
{
  mkdir -p $BACKUP_DIR
}

function delete_old_backups()
{
  echo "Deleting $BACKUP_DIR/*.sql.gz older than $KEEP_BACKUPS_FOR days"
  find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +$KEEP_BACKUPS_FOR -exec rm {} \;
}

function mysql_login() {
  local mysql_login="-u $MYSQL_USER -h $MYSQL_HOST"
  if [ -n "$MYSQL_PASSWORD" ]; then
    local mysql_login+=" -p$MYSQL_PASSWORD"
  fi
  echo $mysql_login
}

function database_list() {
  local show_databases_sql="SHOW DATABASES WHERE \`Database\` NOT REGEXP '$IGNORE_DB'"
  echo $(mysql $(mysql_login) -e "$show_databases_sql"|awk -F " " '{if (NR!=1) print $1}')
}

function echo_status(){
  printf '\r';
  printf ' %0.s' {0..100}
  printf '\r';
  printf "$1"'\r'
}

function backup_database(){
    backup_file="$BACKUP_DIR/$TIMESTAMP.$database.sql.gz"
    output+="$database => $backup_file\n"
    echo_status "...backing up $count of $total databases: $database"
    $(mysqldump $(mysql_login) $database | gzip -9 > $backup_file)
}

function backup_databases(){
  local databases=$(database_list)
  local total=$(echo $databases | wc -w | xargs)
  local output=""
  local count=1
  for database in $databases; do
    backup_database
    local count=$((count+1))
  done
  echo -ne $output | column -t
}

function hr(){
  printf '=%.0s' {1..100}
  printf "\n"
}

#==============================================================================
# RUN SCRIPT
#==============================================================================
prepare
delete_old_backups
hr
backup_databases
hr
printf "All backed up!\n\n"