FROM alpine

RUN apk add --no-cache mysql-client tini openssl bash wget curl \
    && curl -sLo /bin/jq https://github.com/stedolan/jq/releases/download/jq-1.5/jq-linux64 \
    && chmod +x /bin/jq

ENV MYSQL_DATABASE=infrastructure \
    MYSQL_USER=api \
    MYSQL_PASSWORD=api \
    MYSQL_HOST=mariadb

COPY api-watch-push.sh create_jwt.sh /home/

CMD ["tini", "--", "/home/api-watch-push.sh"]
