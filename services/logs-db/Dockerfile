ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/elasticsearch

RUN bin/elasticsearch-plugin install -b com.floragunn:search-guard-6:6.2.4-22.1 \
    && sed -i 's/xpack.security.enabled: false//' config/elasticsearch.yml \
    && chmod a+x plugins/search-guard-6/tools/install_demo_configuration.sh \
    && plugins/search-guard-6/tools/install_demo_configuration.sh -y \
    && sed -i 's/searchguard.ssl.http.*//' config/elasticsearch.yml \
    && sed -i 's/searchguard.audit.type: internal_elasticsearch//' config/elasticsearch.yml \
    && chmod +x plugins/search-guard-6/tools/hash.sh

ENV LOGSDB_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/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 \
    LOGSDB_SLACK_USERNAME=x-pack \
    LOGSDB_SLACK_CHANNEL=#lagoon-dev-alerts \
    LOGSDB_PAGERDUTY_KEY=XXXXU4yGzC2QassuXXXX  \
    LOGSDB_ADMIN_PASSWORD=admin \
    LOGSDB_KIBANASERVER_PASSWORD=kibanaserver \
    BOX_TYPE=live

COPY elasticsearch.yml.append elasticsearch.yml.append
RUN cat elasticsearch.yml.append >> config/elasticsearch.yml

COPY sgconfig/sg_internal_users.yml plugins/search-guard-6/sgconfig/sg_internal_users.yml
COPY sgconfig/sg_config.yml plugins/search-guard-6/sgconfig/sg_config.yml
RUN fix-permissions plugins/search-guard-6/sgconfig

COPY entrypoints/80-keycloak-url.bash /lagoon/entrypoints/

COPY start.sh /start.sh

CMD ["/start.sh"]