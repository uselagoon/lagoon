ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/oc

ENV LAGOON=auto-idler

RUN apk add --no-cache tini jq openssl bash curl nodejs nodejs-npm \
    && npm -g install jwtgen

COPY create_jwt.sh idle-services.sh idle-clis.sh /

ENV JWTSECRET=super-secret-string \
    JWTAUDIENCE=api.dev \
    PROJECT_REGEX=".*"

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.sh"]
CMD ["/bin/docker-sleep"]