CREATE USER 'maxscale'@'%';
UPDATE mysql.user SET PASSWORD=PASSWORD("maxscale") WHERE user="maxscale";

GRANT SELECT ON mysql.user to 'maxscale'@'%';
GRANT SELECT ON mysql.db TO 'maxscale'@'%';
GRANT SELECT ON mysql.tables_priv TO 'maxscale'@'%';
GRANT SUPER ON *.* TO 'maxscale'@'%';

FLUSH PRIVILEGES;
