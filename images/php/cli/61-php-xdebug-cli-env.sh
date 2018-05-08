#!/bin/sh

# Only if XDEBUG_ENABLE is set
if [ ${XDEBUG_ENABLE+x} ]; then
  # XDEBUG_CONFIG is used by xdebug to decide if an xdebug session should be started in the CLI or not.
  # The content doesn't really matter it just needs to be set, the actual connection details are loaded from /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini
  export XDEBUG_CONFIG="idekey=lagoon"
fi

