#!/bin/bash

# envplate the newrelic ini file
ep /usr/local/etc/php/conf.d/newrelic.disable

# enable newrelic only if XDEBUG_ENABLE is set
if [ ${XDEBUG_ENABLE+x} ]; then
  mv /usr/local/etc/php/conf.d/newrelic.disable /usr/local/etc/php/conf.d/newrelic.ini
fi
