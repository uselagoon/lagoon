ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-uselagoon}/commons:${UPSTREAM_TAG:-latest} as commons

RUN apk add --no-cache zip

COPY javascript /tmp/lagoon-scripts

RUN cd /tmp/lagoon-scripts && zip -r ../lagoon-scripts.jar *

FROM quay.io/keycloak/keycloak:17.0.1-legacy

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

USER root

RUN microdnf install -y nc jq \
    && microdnf clean all \
    && rm -rf /var/cache/yum

LABEL maintainer="amazee.io"
ENV LAGOON=keycloak

# Copy commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /home /home

RUN chmod g+w /etc/passwd \
    && mkdir -p /home

# Fix permissions for JBoss home directory
RUN chgrp -R 0 $JBOSS_HOME &&\
    chmod -R g+rw $JBOSS_HOME

# Reproduce behavior of Alpine: Run Bash as sh
RUN rm -f /bin/sh && ln -s /bin/bash /bin/sh

RUN architecture=$(case $(uname -m) in x86_64 | amd64) echo "amd64" ;; aarch64 | arm64 | armv8) echo "arm64" ;; *) echo "amd64" ;; esac) \
    && curl -sL https://github.com/krallin/tini/releases/download/v0.19.0/tini-${architecture} -o /sbin/tini && chmod a+x /sbin/tini

ENV TMPDIR=/tmp \
    TMP=/tmp \
    HOME=/home \
    # When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
    ENV=/home/.bashrc \
    # When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
    BASH_ENV=/home/.bashrc \
    KEYCLOAK_ADMIN_USER=admin \
    KEYCLOAK_ADMIN_PASSWORD=admin \
    KEYCLOAK_REALM=lagoon \
    KEYCLOAK_REALM_ROLES=admin \
    DB_VENDOR=mariadb \
    DB_ADDR=keycloak-db \
    DB_USER=keycloak \
    DB_PASSWORD=keycloak \
    DB_DATABASE=keycloak \
    KEYCLOAK_LAGOON_ADMIN_USERNAME=lagoonadmin \
    KEYCLOAK_LAGOON_ADMIN_PASSWORD=lagoonadmin \
    PROXY_ADDRESS_FORWARDING=true \
    KEYCLOAK_API_CLIENT_SECRET=39d5282d-3684-4026-b4ed-04bbc034b61a \
    KEYCLOAK_AUTH_SERVER_CLIENT_SECRET=f605b150-7636-4447-abd3-70988786b330 \
    KEYCLOAK_SERVICE_API_CLIENT_SECRET=d3724d52-34d1-4967-a802-4d178678564b \
    JAVA_OPTS="-server -Xms2048m -Xmx4096m -XX:MetaspaceSize=96M -XX:MaxMetaspaceSize=256m -Djava.net.preferIPv4Stack=true -Djboss.modules.system.pkgs=org.jboss.byteman -Djava.awt.headless=true"

VOLUME /opt/jboss/keycloak/standalone/data

COPY entrypoints/wait-for-mariadb.sh /lagoon/entrypoints/98-wait-for-mariadb.sh
COPY entrypoints/default-keycloak-entrypoint.sh /lagoon/entrypoints/99-default-keycloak-entrypoint.sh
COPY startup-scripts /opt/jboss/startup-scripts
COPY profile.properties /opt/jboss/keycloak/standalone/configuration/profile.properties
COPY lagoon-test-realm-2.15.4.json /lagoon/keycloak/lagoon-test-realm-2.15.4.json
COPY --from=commons /tmp/lagoon-scripts.jar /opt/jboss/keycloak/standalone/deployments/lagoon-scripts.jar

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.bash"]
CMD ["-b", "0.0.0.0"]
