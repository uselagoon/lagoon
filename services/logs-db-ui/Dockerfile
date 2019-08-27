ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/kibana

ENV NODE_OPTIONS="--max-old-space-size=2048" \
    LOGSDB_KIBANASERVER_PASSWORD=kibanaserver \
    LOGSDB_ADMIN_PASSWORD=admin \
    ELASTICSEARCH_URL=http://logs-db:9200 \
    SEARCHGUARD_OPENID_CLIENT_SECRET=xxxx \
    KEYCLOAK_ADMIN_USER=admin \
    KEYCLOAK_ADMIN_PASSWORD=admin

RUN echo $'xpack.security.enabled: false\n\
xpack.reporting.encryptionKey: "${LOGSDB_UI_XPACK_REPORTING_ENCRYPTIONKEY:-lagoonrocksyou}"\n\
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
searchguard.multitenancy.tenants.enable_global: false\n\
searchguard.multitenancy.tenants.enable_private: false\n\
# v14 and above: Enable OpenID authentication\n\
searchguard.auth.type: "openid"\n\
\n\
# the IdP metadata endpoint\n\
searchguard.openid.connect_url: "${KEYCLOAK_URL:-}/auth/realms/lagoon/.well-known/openid-configuration"\n\
\n\
# the ID of the OpenID Connect client in your IdP\n\
searchguard.openid.client_id: "lagoon-searchguard"\n\
\n\
# the client secret of the OpenID Connect client\n\
searchguard.openid.client_secret: "${SEARCHGUARD_OPENID_CLIENT_SECRET}"\n\
\n\
# the URL of kibana which us used as the redirect URL for openid
searchguard.openid.base_redirect_url: "${LOGSDB_UI_URL:-http://0.0.0.0:5601}"\n\
\n\
# optional: the scope of the identity token\n\
searchguard.openid.scope: "profile email"\n\
\n\
searchguard.cookie.password: "${SEARCHGUARD_COOKIE_PASSWORD:-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa}"\n\
\n\
# disable kibana spaces, as they don\'t work with searchguard multitenancy\n\
xpack.spaces.enabled: false\n\
' >> config/kibana.yml

RUN bin/kibana-plugin install https://search.maven.org/remotecontent?filepath=com/floragunn/search-guard-kibana-plugin/6.6.1-18.1/search-guard-kibana-plugin-6.6.1-18.1.zip

COPY entrypoints/80-keycloak-url.bash /lagoon/entrypoints/
COPY entrypoints/81-logs-db-ui-url.bash /lagoon/entrypoints/
COPY entrypoints/90-keycloak-client-secret.bash /lagoon/entrypoints/

RUN fix-permissions config/kibana.yml

