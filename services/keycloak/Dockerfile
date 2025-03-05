FROM maven:3.9.9-eclipse-temurin-21-alpine as builder
# build the custom token mapper in builder
COPY custom-mapper/. .
RUN mvn clean compile package

FROM registry.access.redhat.com/ubi9 AS ubi-micro-build
RUN mkdir -p /mnt/rootfs
RUN dnf install --installroot /mnt/rootfs nc jq openssl curl unzip --releasever 9 --setopt install_weak_deps=false --nodocs -y; dnf --installroot /mnt/rootfs clean all

ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-uselagoon}/commons:${UPSTREAM_TAG:-latest} AS commons

RUN apk add --no-cache zip

COPY javascript /tmp/lagoon-scripts

RUN cd /tmp/lagoon-scripts && zip -r ../lagoon-scripts.jar *

FROM quay.io/keycloak/keycloak:26.0.7
COPY --from=ubi-micro-build /mnt/rootfs /

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION
ARG DATABASE_VENDOR
ENV DATABASE_VENDOR=$DATABASE_VENDOR

USER root

LABEL maintainer="amazee.io"
ENV LAGOON=keycloak

# Copy commons files
COPY --from=commons /lagoon /lagoon
COPY --from=commons /bin/fix-permissions /bin/ep /bin/docker-sleep /bin/
COPY --from=commons /home /home

RUN chmod g+w /etc/passwd \
    && mkdir -p /home

# Reproduce behavior of Alpine: Run Bash as sh
RUN rm -f /bin/sh && ln -s /bin/bash /bin/sh

RUN architecture=$(case $(uname -m) in x86_64 | amd64) echo "amd64" ;; aarch64 | arm64 | armv8) echo "arm64" ;; *) echo "amd64" ;; esac) \
    && curl -sL https://github.com/krallin/tini/releases/download/v0.19.0/tini-${architecture} -o /sbin/tini && chmod a+x /sbin/tini

RUN cd /opt \
    && curl -O https://download.newrelic.com/newrelic/java-agent/newrelic-agent/current/newrelic-java.zip \
    && unzip newrelic-java.zip \
    && rm newrelic-java.zip

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
    DB_VENDOR=${DATABASE_VENDOR} \
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
    KEYCLOAK_LAGOON_UI_OIDC_CLIENT_SECRET=20580a56-6fbc-11ef-9a5b-3b4da292aa54 \
    KEYCLOAK_ADMIN_API_CLIENT_SECRET=bb86d344-a52d-11ef-b872-4f4337ee24f0 \
    LAGOON_DB_VENDOR=${DATABASE_VENDOR} \
    LAGOON_DB_DATABASE=infrastructure \
    LAGOON_DB_USER=api \
    LAGOON_DB_PASSWORD=api \
    LAGOON_DB_HOST=api-db \
    JAVA_OPTS="-server -Xms2048m -Xmx4096m -XX:MetaspaceSize=96M -XX:MaxMetaspaceSize=256m -Djava.net.preferIPv4Stack=true -Djboss.modules.system.pkgs=org.jboss.byteman -Djava.awt.headless=true"

VOLUME /opt/keycloak/data

RUN curl -sSLo /opt/keycloak/providers/keycloak-home-idp-discovery.jar https://github.com/sventorben/keycloak-home-idp-discovery/releases/download/v26.0.1/keycloak-home-idp-discovery.jar

COPY entrypoints/kc-startup.sh /lagoon/kc-startup.sh
COPY entrypoints/wait-for-mariadb.sh /lagoon/entrypoints/98-wait-for-mariadb.sh
COPY entrypoints/default-keycloak-entrypoint.sh /lagoon/entrypoints/99-default-keycloak-entrypoint.sh

COPY startup-scripts /opt/keycloak/startup-scripts
COPY themes/lagoon /opt/keycloak/themes/lagoon
COPY --from=commons /tmp/lagoon-scripts.jar /opt/keycloak/providers/lagoon-scripts.jar
COPY --from=builder /target/custom-protocol-mapper-1.1.0.jar /opt/keycloak/providers/custom-protocol-mapper-1.1.0.jar

COPY lagoon-realm-base-import.json /lagoon/seed/lagoon-realm-base-import.json

RUN /opt/keycloak/bin/kc.sh build

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.bash"]
CMD ["start"]
