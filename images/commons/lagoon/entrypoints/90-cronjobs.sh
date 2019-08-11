#!/bin/sh
# Only if $CRONJOBS is not empty and /lagoon/crontabs/crontab is not existing yet
if [ -x /lagoon/bin/cron ] && [ ! -z "$CRONJOBS" ] && [ ! -f /lagoon/crontabs/crontab ]; then
  echo "Setting up Cronjobs:"
  echo "${CRONJOBS}"
  echo "${CRONJOBS}" > /lagoon/crontabs/crontab
  # go-crond does not like if group and others have write access to the crontab
  chmod go-w /lagoon/crontabs/crontab
  /lagoon/bin/cron $(whoami):/lagoon/crontabs/crontab --allow-unprivileged --no-auto -v &
fi