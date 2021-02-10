FROM mongo:4.2.3
# generate a self signed mongodb with tls support
COPY mongodb/openssl-test-ca.cnf openssl-test-ca.cnf

RUN openssl genrsa -out mongodb-test-ca.key 4096 && \
    openssl req -subj "/C=PE/ST=Lima/L=Lima/O=Acme Inc. /OU=IT Department/CN=acme.com" -new -x509 -days 1826 -key mongodb-test-ca.key -out mongodb-test-ca.crt -config openssl-test-ca.cnf && \
    openssl genrsa -out mongodb-test-ia.key 4096 && \
    openssl req -subj "/C=PE/ST=Lima/L=Lima/O=Acme Inc. /OU=IT Department/CN=acme.com" -new -key mongodb-test-ia.key -out mongodb-test-ia.csr -config openssl-test-ca.cnf && \
    openssl x509 -sha256 -req -days 730 -in mongodb-test-ia.csr -CA mongodb-test-ca.crt -CAkey mongodb-test-ca.key -set_serial 01 -out mongodb-test-ia.crt -extfile openssl-test-ca.cnf -extensions v3_ca && \
    cat mongodb-test-ca.crt mongodb-test-ia.crt  > test-ca.pem

COPY mongodb/openssl-test-server.cnf openssl-test-server.cnf

RUN openssl genrsa -out mongodb-test-server1.key 4096 && \
    openssl req -subj "/C=PE/ST=Lima/L=Lima/O=Acme Inc. /OU=IT Department/CN=acme.com" -new -key mongodb-test-server1.key -out mongodb-test-server1.csr -config openssl-test-server.cnf && \
    openssl x509 -sha256 -req -days 365 -in mongodb-test-server1.csr -CA mongodb-test-ia.crt -CAkey mongodb-test-ia.key -CAcreateserial -out mongodb-test-server1.crt -extfile openssl-test-server.cnf -extensions v3_req && \
    cat mongodb-test-server1.crt mongodb-test-server1.key > test-server1.pem

COPY mongodb/mongo-init.js ./docker-entrypoint-initdb.d

CMD ["mongod","--tlsMode","requireTLS","--tlsAllowConnectionsWithoutCertificates","--tlsCertificateKeyFile","test-server1.pem","--tlsCAFile","test-ca.pem","--bind_ip","0.0.0.0"]