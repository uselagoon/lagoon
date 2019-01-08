#!/bin/sh

# Tries to find the Dockerhost
get_dockerhost() {
  # https://github.com/amazeeio/pygmy/blob/267ba143158548628f190f05ecb5cb2c19212038/lib/pygmy/resolv_osx.rb#L26
  if busybox timeout -t 1 ping -c1 172.16.172.16 &> /dev/null; then
    echo "172.16.172.16"
    return
  fi

  # Fallback to default gateway (should work on Linux) see https://stackoverflow.com/questions/24319662/from-inside-of-a-docker-container-how-do-i-connect-to-the-localhost-of-the-mach
  echo $(route -n | awk '/UG[ \t]/{print $2}')
  return
}

# Only if XDEBUG_ENABLE is set
if [ ${XDEBUG_ENABLE+x} ]; then
  # remove first line and all comments
  sed -i '1d; s/;//' /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini
  # add comment that explains how we have xdebug enabled
  sed -i '1s/^/;xdebug enabled as XDEBUG_ENABLE is set, see \/lagoon\/entrypoints\/60-php-xdebug.sh \n/' /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini

  # Only if DOCKERHOST is not already set, allows to set a DOCKERHOST via environment variables
  if [[ -z ${DOCKERHOST+x} ]]; then
    DOCKERHOST=$(get_dockerhost)
  fi

  # Add the found remote_host to xdebug.ini
  echo -e "\n\nxdebug.remote_host=${DOCKERHOST}" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini
fi
