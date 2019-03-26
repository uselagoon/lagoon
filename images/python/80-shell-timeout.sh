#!/bin/sh

# If we are running within kubernetes, set a shell timeout of 10mins.
# We do that so old shells are closed and we can idle the cli container
if [ $KUBERNETES_PORT ]; then
  TMOUT=600
fi