# Logs Concentrator

This service collects logs from logs-dispatchers (both local and remote) using
fluentd's forward protocol, and sends them to Elasticsearch.

## Configuration

See the commented sample configuration at the end of `values.yaml`.

## TLS

Clients connect to this service via TLS. Mutual TLS authentication is performed by the client and server.

Important notes:

* Certificates are generated on the cluster `logs-concentrator` runs in so they share the same CA.
* The instructions below require [cfssl](https://github.com/cloudflare/cfssl).
* Refer to [this documentation](https://kubernetes.io/docs/tasks/tls/managing-tls-in-a-cluster/#create-a-certificate-signing-request) for further details.

### Generate a server certificate

This will be the certificate used by the `logs-concentrator`.

NOTE: update `CN`/`hosts` as requried.

Generate a `server.csr` and `server-key.pem`:
```
cat <<EOF | cfssl genkey - | cfssljson -bare server
{
  "hosts": [
    "logs.ch2.amazee.io",
    "lagoon-logs-concentrator.lagoon-logs-concentrator.svc.cluster.local"
  ],
  "CN": "logs.ch2.amazee.io",
  "key": {
    "algo": "ecdsa",
    "size": 256
  }
}
EOF
```

Generate a `CertificateSigningRequest`:
```
cat <<EOF | kubectl apply -f -
apiVersion: certificates.k8s.io/v1beta1
kind: CertificateSigningRequest
metadata:
  name: logs
spec:
  request: $(cat server.csr | base64 | tr -d '\n')
  usages:
  - digital signature
  - key encipherment
  - server auth
EOF
```

Approve the CSR:
```
$ kubectl certificate approve logs
```

Get the signed certificate via:
```
$ kubectl get csr logs -o json | \
    jq -r '.status.certificate | @base64d' > server.crt
```

### Generate a client certificate

This will be the certificate used by the `logs-dispatcher`.

NOTE: update `CN`/`hosts` as requried.

Generate a `client.csr` and `client-key.pem` (replace `test1` with the cluster name:
```
cat <<EOF | cfssl genkey - | cfssljson -bare client
{
  "hosts": [
    "logs-dispatcher.test1.lagoon.sh"
  ],
  "CN": "logs-dispatcher.test1.lagoon.sh",
  "key": {
    "algo": "ecdsa",
    "size": 256
  }
}
EOF
```

Generate a `CertificateSigningRequest`:
```
cat <<EOF | kubectl apply -f -
apiVersion: certificates.k8s.io/v1beta1
kind: CertificateSigningRequest
metadata:
  name: logs-dispatcher.test1
spec:
  request: $(base64 < client.csr | tr -d '\n')
  usages:
  - digital signature
  - key encipherment
  - client auth
EOF
```

Inspect the CSR, note the status `Pending`:
```
$ kubectl get csr
```

Approve the CSR:
```
$ kubectl certificate approve ...
```

Inspect the CSR, note the status `Approved,Issued`:
```
$ kubectl get csr
```

Get the signed certificate via:
```
$ kubectl get csr logs-dispatcher.test1 -o json | \
    jq -r '.status.certificate | @base64d' > client.crt
```

### Get the cluster CA certificate

```
$ kubectl run --rm -it --quiet --restart=Never --image=busybox catca -- cat /var/run/secrets/kubernetes.io/serviceaccount/ca.crt | tee ca.crt
```
