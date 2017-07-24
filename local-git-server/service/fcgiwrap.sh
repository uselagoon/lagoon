#!/bin/sh
exec /usr/bin/spawn-fcgi -n -P /var/run/fcgiwrap.pid -F '1' -s '/var/run/fcgiwrap.socket' -u 'www-data' -U 'www-data' -g 'www-data' -G 'www-data' -- /usr/sbin/fcgiwrap -f