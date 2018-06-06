#!/bin/bash

# Enable NewRelic automatically if there is a newrelic license set
if [ ${NEWRELIC_LICENSE+x} ]; then
  export NEWRELIC_ENABLED=true
fi

# envplate the newrelic ini file
ep /usr/local/etc/php/conf.d/newrelic.ini