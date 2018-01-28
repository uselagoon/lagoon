ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/oc

RUN apk add --no-cache jq openssl bash curl nodejs nodejs-npm \
    && npm -g install jwtgen

COPY create_jwt.sh idle-services.sh /

ENV JWTSECRET=super-secret-string \
    JWTAUDIENCE=api.dev \
    PROJECT_REGEX=".*"
