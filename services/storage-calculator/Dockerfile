ARG UPSTREAM_REPO
ARG UPSTREAM_TAG
FROM ${UPSTREAM_REPO:-uselagoon}/python-3.9:${UPSTREAM_TAG:-latest} as commons

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

ENV LAGOON=storage-calculator

RUN apk add --no-cache tini jq bash curl \
    && pip install PyJWT==2.3.* \
    && curl -Lo /usr/bin/kubectl https://storage.googleapis.com/kubernetes-release/release/v1.23.9/bin/linux/amd64/kubectl \
    && chmod +x /usr/bin/kubectl \
    && curl -Lo /usr/bin/yq https://github.com/mikefarah/yq/releases/download/v4.15.1/yq_linux_amd64 \
    && chmod +x /usr/bin/yq

COPY create_jwt.py calculate-storage.sh /

ENV JWTSECRET=super-secret-string \
    JWTAUDIENCE=api.dev \
    PROJECT_REGEX=".+"

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.sh"]
CMD ["/bin/docker-sleep"]
