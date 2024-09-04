#!/bin/bash

if [ -v NEW_RELIC_LICENSE_KEY ]
then
    echo "Enabling newrelic monitor"

    cat << 'EOF' >> /opt/keycloak/bin/standalone.conf

JAVA_OPTS="$JAVA_OPTS -javaagent:/opt/newrelic/newrelic.jar"
EOF

fi
