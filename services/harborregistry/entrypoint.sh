#!/bin/sh

set -e

# The directory /var/lib/registry is within the container, and used to store image in CI testing.
# So for now we need to chown to it to avoid failure in CI.
#if [ -d /var/lib/registry ]; then
#  chown 10000:10000 -R /var/lib/registry
#fi
#
#if [ -d /storage ]; then
#  if ! stat -c '%u:%g' /storage | grep -q '10000:10000' ; then
#    # 10000 is the id of harbor user/group.
#    # Usually NFS Server does not allow changing owner of the export directory,
#    # so need to skip this step and requires NFS Server admin to set its owner to 10000.
#    chown 10000:10000 -R /storage
#  fi
#fi

if [[ -f "/etc/registry/pre_config.yml" ]]; then

    # if HARBOR_NGINX_ENDPOINT is not defined, we try to load it from LAGOON_ROUTES
    if [[ -z ${HARBOR_NGINX_ENDPOINT+x} ]]; then
        REGEX="(https?://harbor[0-9A-Za-z\.-]+)"

        if [[ $LAGOON_ROUTES =~ $REGEX ]]; then
            export HARBOR_NGINX_ENDPOINT=${BASH_REMATCH[1]}
        else
            echo "Could not load harbor URL from LAGOON_ROUTES, please define via HARBOR_NGINX_ENDPOINT env variable"
            exit 1
        fi
    fi

    sed -e "s|\$HARBOR_NGINX_ENDPOINT|$HARBOR_NGINX_ENDPOINT|g" -e "s|\$HARBOR_REGISTRY_STORAGE_AMAZON_REGION|$HARBOR_REGISTRY_STORAGE_AMAZON_REGION|g" -e "s|\$HARBOR_REGISTRY_STORAGE_AMAZON_BUCKET|$HARBOR_REGISTRY_STORAGE_AMAZON_BUCKET|g" -e "s|\$HARBOR_REGISTRY_STORAGE_AMAZON_ENDPOINT|$HARBOR_REGISTRY_STORAGE_AMAZON_ENDPOINT|g" /etc/registry/pre_config.yml > /etc/registry/config.yml
fi

/home/harbor/install_cert.sh

case "$1" in
  *.yaml|*.yml) set -- registry serve "$@" ;;
  serve|garbage-collect|help|-*) set -- registry "$@" ;;
esac

exec "$@"
#sudo -E -u \#10000 "$@"
