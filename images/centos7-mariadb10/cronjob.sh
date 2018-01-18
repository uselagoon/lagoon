#!/bin/sh

exit_trap() {
  # We want to exit with 0 so OpenShift does not try to restart us
  # see https://docs.openshift.com/container-platform/3.6/dev_guide/jobs.html#creating-a-job-known-issues
  exit 0
}

# on exit, always call exit_trap to always exit with 0
trap exit_trap EXIT

echo "$(date --utc +%FT%TZ) CRONJOB: $@"

sh -c "/usr/sbin/lagoon-entrypoints $@"