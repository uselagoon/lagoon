ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/elasticsearch

RUN bin/elasticsearch-plugin install -b com.floragunn:search-guard-6:6.1.1-22.2 \
    && sed -i 's/xpack.security.enabled: false//' config/elasticsearch.yml \
    && chmod a+x plugins/search-guard-6/tools/install_demo_configuration.sh \
    && plugins/search-guard-6/tools/install_demo_configuration.sh -y \
    && sed -i 's/searchguard.ssl.http.*//' config/elasticsearch.yml

COPY docker-entrypoint.sh /lagoon/entrypoints/95-logs-db.sh
