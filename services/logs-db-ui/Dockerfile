ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/kibana

ENV NODE_OPTIONS="--max-old-space-size=2048" \
    LOGSDB_KIBANASERVER_PASSWORD=kibanaserver \
    LOGSDB_ADMIN_PASSWORD=admin \
    ELASTICSEARCH_URL=http://logs-db:9200

RUN echo $'xpack.security.enabled: false\n\
\n\
# Configure the Kibana internal server user\n\
elasticsearch.username: "kibanaserver"\n\
elasticsearch.password: "${LOGSDB_KIBANASERVER_PASSWORD}"\n\
\n\
# Disable SSL verification because we use self-signed demo certificates\n\
elasticsearch.ssl.verificationMode: none\n\
\n\
# Whitelist the Search Guard Multi Tenancy Header\n\
elasticsearch.requestHeadersWhitelist: [ "Authorization", "sgtenant" ]\n\
\n\
# Enable multitenancy\n\
searchguard.multitenancy.enabled: true\n\
# Disable searchguard global tenant\n\
searchguard.multitenancy.tenants.enable_global: false' >> config/kibana.yml

RUN bin/kibana-plugin install https://search.maven.org/remotecontent?filepath=com/floragunn/search-guard-kibana-plugin/6.2.4-13/search-guard-kibana-plugin-6.2.4-13.zip

COPY ./init/ /lagoon/kibana-init
COPY entrypoints/90-kibanayaml-envplate.sh /lagoon/entrypoints/

RUN fix-permissions config/kibana.yml \
    && fix-permissions /lagoon/kibana-init

