FROM alpine:3.7

RUN apk add --no-cache mysql-client tini openssl bash wget curl nodejs nodejs-npm \
    && npm -g install jwtgen

ENV MYSQL_DATABASE=infrastructure \
    MYSQL_USER=api \
    MYSQL_PASSWORD=api \
    MYSQL_HOST=mariadb \
    JWTSECRET=super-secret-string \
    JWTAUDIENCE=api.dev

COPY api-watch-push.sh create_jwt.sh /home/

CMD ["tini", "--", "/home/api-watch-push.sh"]
