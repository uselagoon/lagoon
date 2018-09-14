#!/bin/sh
# Fix permissions on the given directory to allow group read/write of
# regular files and execute of directories.
find -L "$1" -exec chgrp 0 {} \;
find -L "$1" -exec chmod g+rw {} \;
find -L "$1" -type d -exec chmod g+x {} +
