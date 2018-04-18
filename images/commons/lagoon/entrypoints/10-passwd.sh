#!/bin/sh

if [ -w /etc/passwd ]; then
  # Change root's home folder to /home
  sed -i 's/root:\/root:/root:\/home:/' /etc/passwd

  # If we don't know who we are (whoami returns false) add a new entry into the users list
  if ! whoami &> /dev/null; then
    echo "${USER_NAME:-user}:x:$(id -u):0:${USER_NAME:-user}:${HOME}:/bin/sh" >> /etc/passwd
  fi
fi
