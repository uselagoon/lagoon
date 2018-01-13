ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/logstash

COPY logstash.conf pipeline/logstash.conf

ENV RABBITMQ_HOST="rabbitmq" \
    RABBITMQ_USER="guest" \
    RABBITMQ_PASSWORD="guest"
ENV ELASTICSEARCH_URL="http://logs-db:9200"