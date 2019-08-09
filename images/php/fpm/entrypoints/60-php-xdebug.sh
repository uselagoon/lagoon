#!/bin/sh

# Tries to find the Dockerhost
get_dockerhost() {
  # https://docs.docker.com/docker-for-mac/networking/#known-limitations-use-cases-and-workarounds
  if busybox timeout -t 1 ping -c1 docker.for.mac.localhost &> /dev/null; then
    echo "docker.for.mac.localhost"
    return
  fi

  # https://docs.docker.com/docker-for-windows/release-notes/#docker-community-edition-17060-win13-release-notes-2017-06-01-17060-rc1-ce-win13-edge
  if busybox timeout -t 1 ping -c1 docker.for.win.localhost &> /dev/null; then
    echo "docker.for.win.localhost"
    return
  fi

  # https://github.com/amazeeio/pygmy/blob/267ba143158548628f190f05ecb5cb2c19212038/lib/pygmy/resolv_osx.rb#L26
  if busybox timeout -t 1 ping -c1 172.16.172.16 &> /dev/null; then
    echo "172.16.172.16"
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
