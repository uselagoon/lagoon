#!/bin/sh

set -eu -o pipefail

# directory to put the backup files
BACKUP_DIR=/var/lib/postgresql/data/backup

# MYSQL Parameters
PGUSER=${POSTGRES_USER:-lagoon}
PGPASSWORD=${POSTGRES_PASSWORD:-lagoon}

PGHOST=$1

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


function database_list() {
  echo $(psql -At -c "select datname from pg_database where not datistemplate and datallowconn and datname != 'postgres';" postgres)
}

function echo_status(){
  printf '\r';
  printf ' %0.s' {0..100}
  printf '\r';
  printf "$1"'\r'
}

function backup_database(){
    backup_file="$BACKUP_DIR/$TIMESTAMP.$database.sql.gz"
    output="${output}${database} => $backup_file\n"
    echo_status "...backing up $count of $total databases: $database"
    $(pg_dump $database | gzip -9 > $backup_file)
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
  echo -ne $output
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