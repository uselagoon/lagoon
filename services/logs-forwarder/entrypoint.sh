#!/usr/bin/dumb-init /bin/sh

# If $FLUENT_FORWARD_EXTERNAL_ENABLED is set, we enable the forward external config
if [ "$LOGS_FORWARDER_EXTERNAL_FLUENTD_ENABLED" ] && [ -f /fluentd/etc/logs-copy-forward-external-fluentd.conf.disabled ]; then

  # check that all env variables are set that we will need.
  if [ -z $LOGS_FORWARDER_EXTERNAL_FLUENTD_SHARED_KEY ]; then echo "LOGS_FORWARDER_EXTERNAL_FLUENTD_SHARED_KEY is not set, but needed for FLUENT_FORWARD_EXTERNAL_ENABLED"; exit 1; fi
  if [ -z $LOGS_FORWARDER_EXTERNAL_FLUENTD_HOST ]; then echo "LOGS_FORWARDER_EXTERNAL_FLUENTD_HOST is not set, but needed for FLUENT_FORWARD_EXTERNAL_ENABLED"; exit 1; fi
  if [ -z $LOGS_FORWARDER_EXTERNAL_FLUENTD_PORT ]; then echo "LOGS_FORWARDER_EXTERNAL_FLUENTD_PORT is not set, but needed for FLUENT_FORWARD_EXTERNAL_ENABLED"; exit 1; fi

  mkdir -p /fluentd/conf.d/

  cp /fluentd/etc/logs-copy-forward-external-fluentd.conf.disabled  /fluentd/conf.d/logs-copy-forward-external-fluentd.conf
fi

exec "$@"
