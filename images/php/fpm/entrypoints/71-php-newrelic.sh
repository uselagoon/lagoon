#!/bin/bash

# envplate the newrelic ini file
ep /usr/local/etc/php/conf.d/newrelic.disable

# enable newrelic only if NEWRELIC_ENABLED is set
if [ ${NEWRELIC_ENABLED+x} ]; then
  mv /usr/local/etc/php/conf.d/newrelic.disable /usr/local/etc/php/conf.d/newrelic.ini
fi
