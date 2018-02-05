#!/bin/bash
#
# Adfinis SyGroup AG
# openshift-mariadb-galera: Container setup script
#


# Locations
MYSQL_CONFIG_DIR="/etc/my.cnf.d"
MYSQL_DATA_DIR="/var/lib/mysql"
MYSQL_RUN_DIR="/var/run/mysql"

# Fix data directory permissions
rm -rf ${MYSQL_DATA_DIR}
mkdir -p ${MYSQL_DATA_DIR}
chown -R mysql:0 ${MYSQL_DATA_DIR}
chmod -R g+w ${MYSQL_DATA_DIR}
restorecon -R ${MYSQL_DATA_DIR}


# Create config dir & fix permissions
mkdir -p ${MYSQL_CONFIG_DIR}
chown -R 27:0 ${MYSQL_CONFIG_DIR}
chmod -R g+w ${MYSQL_CONFIG_DIR}
restorecon -R ${MYSQL_CONFIG_DIR}

# Create run directory
mkdir -p ${MYSQL_RUN_DIR}
chown -R 27:0 ${MYSQL_RUN_DIR}
chmod -R g+w ${MYSQL_RUN_DIR}
restorecon -R ${MYSQL_RUN_DIR}
