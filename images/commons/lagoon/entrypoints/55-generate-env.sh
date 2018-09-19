#!/bin/sh

# Create a LAGOON_DOMAIN from LAGOON_ROUTE but without the scheme (http:// or https://)
export LAGOON_DOMAIN=${LAGOON_ROUTE#*://}