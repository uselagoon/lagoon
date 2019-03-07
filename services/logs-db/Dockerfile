ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/elasticsearch

RUN bin/elasticsearch-plugin install -b com.floragunn:search-guard-6:6.6.1-24.1 \
    && chmod a+x plugins/search-guard-6/tools/install_demo_configuration.sh \
    && plugins/search-guard-6/tools/install_demo_configuration.sh -y \
    && sed -i 's/searchguard.ssl.http.*//' config/elasticsearch.yml \
    && sed -i 's/searchguard.audit.type: internal_elasticsearch//' config/elasticsearch.yml \
    && echo "searchguard.roles_mapping_resolution: BOTH" >> config/elasticsearch.yml \
    && echo "xpack.monitoring.collection.enabled: true" >> config/elasticsearch.yml \
    && echo "xpack.monitoring.history.duration: 1d" >> config/elasticsearch.yml \
    && echo "node.attr.box_type: \${BOX_TYPE}" >> config/elasticsearch.yml \
    && chmod +x plugins/search-guard-6/tools/hash.sh

ENV LOGSDB_ADMIN_PASSWORD=admin \
    LOGSDB_KIBANASERVER_PASSWORD=kibanaserver \
    BOX_TYPE=live

COPY sgconfig/sg_roles_mapping.yml plugins/search-guard-6/sgconfig/sg_roles_mapping.yml
COPY sgconfig/sg_internal_users.yml plugins/search-guard-6/sgconfig/sg_internal_users.yml
COPY sgconfig/sg_config.yml plugins/search-guard-6/sgconfig/sg_config.yml
RUN fix-permissions plugins/search-guard-6/sgconfig

COPY entrypoints/80-keycloak-url.bash /lagoon/entrypoints/

COPY start.sh /start.sh
COPY es-curl /usr/share/elasticsearch/bin/es-curl

CMD ["/start.sh"]