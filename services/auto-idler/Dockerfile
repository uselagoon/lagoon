ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/oc

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION
ENV LAGOON=auto-idler

RUN apk add --no-cache tini jq bash curl py3-jwt

COPY create_jwt.py idle-services.sh idle-clis.sh openshift-clis.sh openshift-services.sh /

ENV JWTSECRET=super-secret-string \
    JWTAUDIENCE=api.dev \
    PROJECT_REGEX=".+"  \
    OPENSHIFT_REGEX=".+"  \
    ROUTER_LOG_INTERVAL=4h \
    POD_RUN_INTERVAL=14400 \
    ELASTICSEARCH_URL="http://logs-db-service:9200"

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.sh"]
CMD ["/bin/docker-sleep"]
