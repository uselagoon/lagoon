FROM golang:alpine

WORKDIR /go-dbaas

ADD . .

RUN go get github.com/joho/godotenv

RUN go build && chmod +x ./go-dbaas

ENV MARIADB_PASSWORD=lagoon \
MARIADB_USERNAME=lagoon \
MARIADB_DATABASE=lagoon \
MARIADB_HOST=mariadb \
POSTGRES_USERNAME=lagoon \
POSTGRES_PASSWORD=lagoon \
POSTGRES_DATABASE=lagoon \
POSTGRES_HOST=postgres \
SOLR_HOST=solr \
REDIS_HOST=redis \
OPENSEARCH_HOST=opensearch \
MONGO_HOST=mongo \
MONGO_DATABASE=lagoon

EXPOSE 3000

CMD sleep 10 && ./go-dbaas