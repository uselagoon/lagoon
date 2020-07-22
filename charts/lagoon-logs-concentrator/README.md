# Logs Concentrator

This service collects logs from logs-dispatchers (both local and remote) using
fluentd's forward protocol, and sends them to Elasticsearch.

## Configuration

See the commented sample configuration at the end of `values.yaml`.

## TLS

Clients connect to this service via TLS. Mutual TLS authentication is performed by the client and server.

Important notes:

* We run our own CA since the in-cluster CA signs certificates with only one year expiry.
* The instructions below require [cfssl](https://github.com/cloudflare/cfssl).
* Refer to [this documentation](https://coreos.com/os/docs/latest/generate-self-signed-certificates.html) for further details.

### Generate a CA certificate

This is only required the first time you set up this chart.

Edit the `ca-csr.json` as required and run this command:

```
cfssl gencert -initca ca-csr.json | cfssljson -bare ca -
rm ca.csr
```

You'll end up with `ca-key.pem` and `ca.pem`, which are the CA key and certificate. Store these somewhere safe, they'll be used to generate all future certificates.

### Generate a server certificate

This will be the certificate used by the `logs-concentrator`.

Edit the `server.json` as required and run this command:

```
cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=server server.json | cfssljson -bare server
rm server.csr
```

### Generate a client certificate

This will be the certificate used by the `lagoon-logging` chart's `logs-dispatcher`.

Edit the `client.json` as required and run this command:

```
cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=client client.json | cfssljson -bare client
rm client.csr
```
