#!/bin/bash

set -e

if [[ -n "${DEBUG}" ]]; then
    set -x
fi

export MYSQL_ROOT_PASSWORD='password'
export MYSQL_USER='mariadb'
export MYSQL_PASSWORD='mariadb'
export MYSQL_DATABASE='mariadb'
export MYSQL_HOST='mariadb'

cid="$(
	docker run -d \
	    -e DEBUG \
		-e MYSQL_ROOT_PASSWORD \
		-e MYSQL_USER \
		-e MYSQL_PASSWORD \
		-e MYSQL_DATABASE \
		--name "${MYSQL_HOST}" \
		"${IMAGE}"
)"
trap "docker rm -vf ${cid} > /dev/null" EXIT

mariadb() {
	docker run --rm -i \
	    -e DEBUG -e MYSQL_USER -e MYSQL_ROOT_PASSWORD -e MYSQL_PASSWORD -e MYSQL_DATABASE \
	    -v /tmp:/mnt/backups \
	    --link "${MYSQL_HOST}":"${MYSQL_HOST}" \
	    "${IMAGE}" \
	    "${@}" \
	    host="${MYSQL_HOST}"
}

mariadb make check-ready delay_seconds=5 wait_seconds=5 max_try=12
mariadb make query query="CREATE TABLE test (a INT, b INT, c VARCHAR(255))"
[ "$(mariadb make query-silent query='SELECT COUNT(*) FROM test')" = 0 ]
mariadb make query query="INSERT INTO test VALUES (1, 2, 'hello')"
[ "$(mariadb make query-silent query='SELECT COUNT(*) FROM test')" = 1 ]
mariadb make query query="INSERT INTO test VALUES (2, 3, 'goodbye!')"
[ "$(mariadb make query-silent query='SELECT COUNT(*) FROM test')" = 2 ]
mariadb make query query="DELETE FROM test WHERE a = 1"
[ "$(mariadb make query-silent query='SELECT COUNT(*) FROM test')" = 1 ]
mariadb make query query="DELETE FROM test WHERE a = 1"
[ "$(mariadb make query-silent query='SELECT c FROM test')" = 'goodbye!' ]
mariadb make query query="DELETE FROM test WHERE a = 1"

mariadb make query query="CREATE TABLE cache_this (a INT, b INT, c VARCHAR(255))"
mariadb make query query="CREATE TABLE cache_that (a INT, b INT, c VARCHAR(255))"
mariadb make query query="INSERT INTO cache_this VALUES (1, 2, 'hello')"
mariadb make query query="INSERT INTO cache_that VALUES (1, 2, 'hello')"

[ "$(mariadb make query-silent query='SELECT COUNT(*) FROM cache_this')" = 1 ]
[ "$(mariadb make query-silent query='SELECT COUNT(*) FROM cache_that')" = 1 ]

mariadb make query query="CREATE TABLE test1 (a INT, b INT, c VARCHAR(255))"
mariadb make query query="CREATE TABLE test2 (a INT, b INT, c VARCHAR(255))"
mariadb make query query="INSERT INTO test1 VALUES (1, 2, 'hello')"
mariadb make query query="INSERT INTO test2 VALUES (1, 2, 'hello!')"

mariadb make backup filepath="/mnt/backups/export.sql.gz" 'ignore="test1;test2;cache_%;test3"'
mariadb make query query="DROP DATABASE mariadb"
mariadb make import source="/mnt/backups/export.sql.gz"

[ "$(mariadb make query-silent query='SELECT COUNT(*) FROM cache_this')" = 0 ]
[ "$(mariadb make query-silent query='SELECT COUNT(*) FROM cache_that')" = 0 ]

[ "$(mariadb make query-silent query='SELECT COUNT(*) FROM test')" = 1 ]
[ "$(mariadb make query-silent query='SELECT COUNT(*) FROM test1')" = 0 ]
[ "$(mariadb make query-silent query='SELECT COUNT(*) FROM test2')" = 0 ]

mariadb make import source="https://s3.amazonaws.com/wodby-sample-files/mariadb-import-test/export.zip"
mariadb make import source="https://s3.amazonaws.com/wodby-sample-files/mariadb-import-test/export.tar.gz"
