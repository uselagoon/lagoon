FROM alpine:3.7

RUN apk add --no-cache tini bash wget curl

ENV KIBANA_HOST=logs-db-ui

COPY watch-push.sh /home/

CMD ["tini", "--", "/home/watch-push.sh"]
