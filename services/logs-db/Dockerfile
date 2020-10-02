ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-uselagoon}/elasticsearch-7:${UPSTREAM_TAG:-latest}

RUN bin/elasticsearch-plugin install -b https://d3g5vo6xdbdb9a.cloudfront.net/downloads/elasticsearch-plugins/opendistro-security/opendistro_security-1.6.0.0.zip \
    && bin/elasticsearch-plugin install https://d3g5vo6xdbdb9a.cloudfront.net/downloads/elasticsearch-plugins/opendistro-sql/opendistro_sql-1.6.0.0.zip \
    && bin/elasticsearch-plugin install -b repository-s3 \
    && bin/elasticsearch-plugin install -b repository-azure \
    && chmod a+x /usr/share/elasticsearch/plugins/opendistro_security/tools/install_demo_configuration.sh \
    && /usr/share/elasticsearch/plugins/opendistro_security/tools/install_demo_configuration.sh -y \
    && sed -i 's/opendistro_security.ssl.http.*//' config/elasticsearch.yml \
    && sed -i 's/opendistro_security.audit.type: internal_elasticsearch//' config/elasticsearch.yml \
    && echo "opendistro_security.roles_mapping_resolution: BOTH" >> config/elasticsearch.yml \
    && echo "xpack.monitoring.collection.enabled: true" >> config/elasticsearch.yml \
    && echo "xpack.monitoring.history.duration: 1d" >> config/elasticsearch.yml \
    && echo "node.attr.box_type: \${BOX_TYPE}" >> config/elasticsearch.yml \
    && chmod +x plugins/opendistro_security/tools/hash.sh

ENV LOGSDB_ADMIN_PASSWORD=admin \
    LOGSDB_KIBANASERVER_PASSWORD=kibanaserver \
    BOX_TYPE=live \
    NODE_ML=false \
    XPACK_ML_ENABLED=false \
    XPACK_WATCHER_ENABLED=false \
    JAVA_HOME=/usr/share/elasticsearch/jdk

COPY opendistro_security/roles_mapping.yml plugins/opendistro_security/securityconfig/roles_mapping.yml
COPY opendistro_security/internal_users.yml plugins/opendistro_security/securityconfig/internal_users.yml
COPY opendistro_security/config.yml plugins/opendistro_security/securityconfig/config.yml
RUN fix-permissions plugins/opendistro_security/securityconfig

COPY entrypoints/80-keycloak-url.bash /lagoon/entrypoints/

COPY start.sh /start.sh

CMD ["/start.sh"]
