ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/kibana

COPY ./init/ /lagoon/kibana-init

RUN fix-permissions /lagoon/kibana-init

ENV NODE_OPTIONS="--max-old-space-size=2048"

RUN echo $'xpack.security.enabled: false\n\
\n\
# Configure the Kibana internal server user\n\
elasticsearch.username: "admin"\n\
elasticsearch.password: "admin"\n\
\n\
# Disable SSL verification because we use self-signed demo certificates\n\
elasticsearch.ssl.verificationMode: none\n\
\n\
# Whitelist the Search Guard Multi Tenancy Header\n\
elasticsearch.requestHeadersWhitelist: [ "Authorization", "sgtenant" ]' >> config/kibana.yml

RUN bin/kibana-plugin install https://search.maven.org/remotecontent?filepath=com/floragunn/search-guard-kibana-plugin/6.1.1-12/search-guard-kibana-plugin-6.1.1-12.zip

ENV ELASTICSEARCH_URL=http://logs-db:9200
