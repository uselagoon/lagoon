#!/bin/sh

# Tries to find the Dockerhost
get_dockerhost() {
  # https://docs.docker.com/docker-for-mac/networking/#known-limitations-use-cases-and-workarounds
  if busybox timeout 1 busybox nslookup -query=A host.docker.internal &> /dev/null; then
    echo "host.docker.internal"
    return
  fi

  # Fallback to default gateway (should work on Linux) see https://stackoverflow.com/questions/24319662/from-inside-of-a-docker-container-how-do-i-connect-to-the-localhost-of-the-mach
  echo $(route -n | awk '/UG[ \t]/{print $2}')
  return
}

# Only if XDEBUG_ENABLE is not empty
if [ ! -z ${XDEBUG_ENABLE} ]; then
  # remove first line and all comments
  sed -i '1d; s/;//' /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini
  # add comment that explains how we have xdebug enabled
  sed -i '1s/^/;xdebug enabled as XDEBUG_ENABLE is not empty, see \/lagoon\/entrypoints\/60-php-xdebug.sh \n/' /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini

  # Only if DOCKERHOST is not already set, allows to set a DOCKERHOST via environment variables
  if [[ -z ${DOCKERHOST+x} ]]; then
    DOCKERHOST=$(get_dockerhost)
  fi

  # Add the found remote_host to xdebug.ini
  echo -e "\n\nxdebug.remote_host=${DOCKERHOST}" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini

  if [ ${XDEBUG_LOG+x} ]; then
    echo -e "\n\nxdebug.remote_log=/tmp/xdebug.log" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini
  fi
fi
