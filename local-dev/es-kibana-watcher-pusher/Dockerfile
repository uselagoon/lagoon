FROM alpine:3.7

RUN apk add --no-cache tini bash wget curl

ENV KIBANA_HOST=logs-db-ui \
    LOGSDB_KIBANASERVER_PASSWORD=kibanaserver \
    LOGSDB_ADMIN_PASSWORD=admin

COPY watch-push.sh /home/

CMD ["tini", "--", "/home/watch-push.sh"]
