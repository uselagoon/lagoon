FROM golang:alpine

WORKDIR /go-dbaas

ADD . .

RUN go get github.com/joho/godotenv

RUN go build && chmod +x ./go-dbaas

ENV SOLR_HOST=solr \
    REDIS_HOST=redis \
    OPENSEARCH_HOST=opensearch-2

EXPOSE 3000

CMD sleep 10 && ./go-dbaas
