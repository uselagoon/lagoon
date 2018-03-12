CREATE USER 'maxscale'@'%';
UPDATE mysql.user SET PASSWORD=PASSWORD("maxscale") WHERE user="maxscale";

GRANT SELECT ON mysql.user to 'maxscale'@'%';
GRANT SELECT ON mysql.db TO 'maxscale'@'%';
GRANT SELECT ON mysql.tables_priv TO 'maxscale'@'%';
GRANT SHOW DATABASES ON *.* TO 'maxscale'@'%';
GRANT REPLICATION SLAVE ON *.* to 'maxscale'@'%';
GRANT REPLICATION CLIENT ON *.* to 'maxscale'@'%';

flush privileges;
