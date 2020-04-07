#!/bin/bash

# enable newrelic only if NEWRELIC_ENABLED is set
if [ ${NEWRELIC_ENABLED+x} ]; then
  # envplate the newrelic ini file
  ep /usr/local/etc/php/conf.d/newrelic.disable

  cp /usr/local/etc/php/conf.d/newrelic.disable /usr/local/etc/php/conf.d/newrelic.ini

  # check if newrelic is running before trying to do tasks as it can cause them to fail, can delay container start by a few seconds
  # https://discuss.newrelic.com/t/php-agents-tries-to-connect-before-daemon-is-ready/48160/9
  php -r '$count=0;while(!newrelic_set_appname(ini_get("newrelic.appname")) && $count < 10){ $count++; echo "Waiting for NewRelic Agent to be responsive. ($count)" . PHP_EOL; sleep(1); }'
fi
