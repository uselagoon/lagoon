ARG ALPINE_VERSION
FROM alpine:${ALPINE_VERSION}

RUN apk add --no-cache mysql-client tini openssl bash wget curl nodejs nodejs-npm \
    && npm config set unsafe-perm true \
    && npm -g install jwtgen

ENV JWTSECRET=super-secret-string \
    JWTAUDIENCE=api.dev

COPY api-watch-push.sh create_jwt.sh /home/

CMD ["tini", "--", "/home/api-watch-push.sh"]
