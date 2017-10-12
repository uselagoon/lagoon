FROM alpine

RUN apk add --no-cache mysql-client tini bash

ENV MYSQL_DATABASE=infrastructure \
    MYSQL_USER=api \
    MYSQL_PASSWORD=api \
    MYSQL_HOST=mariadb

COPY api-watch-push.sh /home/api-watch-push.sh

CMD ["tini", "--", "/home/api-watch-push.sh"]
