CREATE USER '${MAXSCALE_USERNAME:-maxscale}'@'%' identified by '${MAXSCALE_PASSWORD:-maxscale}';
GRANT SELECT ON mysql.user to '${MAXSCALE_USERNAME:-maxscale}'@'%';
GRANT SELECT ON mysql.db TO '${MAXSCALE_USERNAME:-maxscale}'@'%';
GRANT SELECT ON mysql.tables_priv TO '${MAXSCALE_USERNAME:-maxscale}'@'%';
GRANT SHOW DATABASES ON *.* TO '${MAXSCALE_USERNAME:-maxscale}'@'%';
GRANT REPLICATION SLAVE ON *.* to '${MAXSCALE_USERNAME:-maxscale}'@'%';
GRANT REPLICATION CLIENT ON *.* to '${MAXSCALE_USERNAME:-maxscale}'@'%';
