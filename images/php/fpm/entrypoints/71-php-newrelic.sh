#!/bin/bash

# envplate the newrelic ini file
ep /usr/local/etc/php/conf.d/newrelic.disable

# enable newrelic
mv /usr/local/etc/php/conf.d/newrelic.disable /usr/local/etc/php/conf.d/newrelic.ini
