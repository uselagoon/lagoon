#!/bin/sh

if [ -w /etc/passwd ]; then
  # Change root's home folder to /home
  # (we can't use `sed -i` as we sed would create the tempfile in /etc)
  TMPFILE=$(mktemp -p /tmp passwd.XXXXXX)
  sed 's/root:\/root:/root:\/home:/' /etc/passwd > "$TMPFILE"
  cat "$TMPFILE" > /etc/passwd
  rm "$TMPFILE"

  # If we don't know who we are (whoami returns false) add a new entry into the users list
  if ! whoami &> /dev/null; then
    echo "${USER_NAME:-user}:x:$(id -u):0:${USER_NAME:-user}:${HOME}:/bin/sh" >> /etc/passwd
  fi
fi
