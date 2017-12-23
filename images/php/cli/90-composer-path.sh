#!/bin/sh

add_to_PATH () {
  for d; do
    d=$({ cd -- "$d" && { pwd -P || pwd; } } 2>/dev/null)  # canonicalize symbolic links
    if [ -z "$d" ]; then continue; fi  # skip nonexistent directory
    case ":$PATH:" in
      *":$d:"*) :;;
      *) PATH=$d:$PATH;;
    esac
  done
}

add_to_PATH /home/.composer/vendor/bin