#!/bin/sh

# There are some additional steps to deploy this service.

sudo gem install fluent-plugin-secure-forward

secure-forward-ca-generate "$(pwd)" $FLUENT_PASSPHRASE

oc create secret generic collector \
    --from-file=FORWARD_CERTIFICATE=ca_cert.pem \
    --from-file=FORWARD_KEY=ca_key.pem   \
    --from-literal=FORWARD_PASSPHRASE=${FLUENT_PASSPHRASE}
