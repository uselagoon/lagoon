#!/bin/sh
exec /usr/bin/spawn-fcgi -n -P /run/fcgiwrap.pid -F '1' -s '/run/fcgiwrap.socket' -u 'nginx' -U 'nginx' -g 'nginx' -G 'nginx' -- /usr/bin/fcgiwrap -f
