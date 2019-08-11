#!/bin/sh

add_to_PATH () {
  for d; do
    case ":$PATH:" in
      *":$d:"*) :;;
      *) PATH=$d:$PATH;;
    esac
  done
}

add_to_PATH /home/.composer/vendor/bin