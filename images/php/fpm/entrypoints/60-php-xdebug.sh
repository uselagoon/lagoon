#!/bin/sh

# Only if XDEBUG_ENABLE is set
if [ ${XDEBUG_ENABLE+x} ]; then
  # remove first line and all comments
  sed -i '1d; s/;//' /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini
  # add comment that explains how we have xdebug enabled
  sed -i '1s/^/;xdebug enabled as XDEBUG_ENABLE is set, see \/lagoon\/entrypoints\/60-php-xdebug.sh \n/' /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini
fi