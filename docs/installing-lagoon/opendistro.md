# OpenDistro

To install an OpenDistro cluster, you will need to configure TLS and secrets so that Lagoon can talk to it securely. You're going to have to create a handful of JSON files - put these in the same directory as the values files you've been creating throughout this installation process.

Install OpenDistro Helm, according to [https://opendistro.github.io/for-elasticsearch-docs/docs/install/helm/](https://opendistro.github.io/for-elasticsearch-docs/docs/install/helm/)

## Create Keys and Certificates

1. Generate certificates

  !!! Note "Note:"
      _CFSSL is CloudFlare's PKI/TLS swiss army knife. It is both a command line tool and an HTTP API server for signing, verifying, and bundling TLS certificates. It requires Go 1.12+ to build._

  1.  Install CFSSL:  [https://github.com/cloudflare/cfssl](https://github.com/cloudflare/cfssl)
  2. Generate CA. You'll need the following file:

  ```json title="ca-csr.json"
  {
    "CN": "ca.elasticsearch.svc.cluster.local",
    "hosts": [
      "ca.elasticsearch.svc.cluster.local"
    ],
    "key": {
      "algo": "ecdsa",
      "size": 256
    },
    "ca": {
    "expiry": "87600h"
    }
  }
  ```

1. Run the following two commands:

  ```bash title="Generate certificate"
  cfssl gencert -initca ca-csr.json | cfssljson -bare ca -
  rm ca.csr
  ```

  You'll get `ca-key.pem`, and `ca.pem`. This is your CA key and self-signed certificate.

3. Next, we'll generate the node peering certificate. You'll need the following two files:

  ```json title="ca-config.json"
  {
    "signing": {
      "default": {
        "expiry": "87600h"
      },
      "profiles": {
        "peer": {
            "expiry": "87600h",
            "usages": [
              "signing",
                "key encipherment",
                "server auth",
                "client auth"
            ]
          },
        "client": {
            "expiry": "87600h",
            "usages": [
              "signing",
              "key encipherment",
              "client auth"
            ]
        }
      }
    }
  }
  ```

  ```json title="node.json"
  {
    "hosts": [
      "node.elasticsearch.svc.cluster.local"
    ],
    "CN": "node.elasticsearch.svc.cluster.local",
    "key": {
      "algo": "ecdsa",
      "size": 256
    }
  }
  ```

4. Run the following two commands:

  ```bash title="Generate certificate keys"
  cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=peer node.json | cfssljson -bare node
  rm node.csr
  ```

  You'll get `node.pem` and `node-key.pem`. This is the peer certificate that will be used by nodes in the ES cluster.

5. Next, we'll convert the key to the format supported by Java with the following command:

  ```bash title="Convert key format"
  openssl pkey -in node-key.pem -out node-key.pkcs8
  ```

6. Now we'll generate the admin certificate. You'll need the following file:

  ```json title="admin.json"
  {
    "CN": "admin.elasticsearch.svc.cluster.local",
    "key": {
      "algo": "ecdsa",
      "size": 256
    }
  }
  ```

7. Run the following two commands:

  ```bash title="Generate admin certificate keys"
  cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=client admin.json | cfssljson -bare admin
  rm admin.csr
  ```

  You'll get `admin.pem` and `admin-key.pem`. This is the certificate that will be used to perform admin commands on the opendistro-security plugin.

8. Next, we'll convert the key to the format supported by Java with the following command:

  ```bash title="Convert key format"
  openssl pkey -in admin-key.pem -out admin-key.pkcs8
  ```

## Installing OpenDistro

Now that we have our keys and certificates, we can continue with the installation.

1. Generate hashed passwords.
   1. The `elasticsearch-secrets-values.yaml` needs two hashed passwords. Create them with this command (run it twice, enter a random password, store both the plaintext and hashed passwords).

  ```bash title="Generate hashed passwords"
  docker run --rm -it docker.io/amazon/opendistro-for-elasticsearch:1.12.0 sh -c "chmod +x /usr/share/elasticsearch/plugins/opendistro_security/tools/hash.sh; /usr/share/elasticsearch/plugins/opendistro_security/tools/hash.sh"
  ```

1. Create secrets:

  1. You'll need to create `elasticsearch-secrets-values.yaml`. See this gist as an example: [https://gist.github.com/Schnitzel/43f483dfe0b23ca0dddd939b12bb4b0b](https://gist.github.com/Schnitzel/43f483dfe0b23ca0dddd939b12bb4b0b)

2. Install secrets with the following commands:

  ```bash title="Install secrets"
  helm repo add incubator https://charts.helm.sh/incubator`
  helm upgrade --namespace elasticsearch --create-namespace --install elasticsearch-secrets incubator/raw --values elasticsearch-secrets-values.yaml `
  ```

3. You'll need to create `elasticsearch-values.yaml`.  See this gist as an example: (fill all <\<Placeholders>> with values) [https://gist.github.com/Schnitzel/1e386654b6abf75bf4d66a544db4aa6a](https://gist.github.com/Schnitzel/1e386654b6abf75bf4d66a544db4aa6a)
4. Install Elasticsearch:

  ```bash title="Install Elasticsearch"
  helm upgrade --namespace elasticsearch --create-namespace --install elasticsearch opendistro-es-X.Y.Z.tgz --values elasticsearch-values.yaml
  ```

5. Configure security inside Elasticsearch with the following:

  ```bash title="Configure security"
  kubectl exec -n elasticsearch -it elasticsearch-opendistro-es-master-0 -- bash
  chmod +x /usr/share/elasticsearch/plugins/opendistro_security/tools/securityadmin.sh
  /usr/share/elasticsearch/plugins/opendistro_security/tools/securityadmin.sh -nhnv -cacert /usr/share/elasticsearch/config/admin-root-ca.pem -cert /usr/share/elasticsearch/config/admin-crt.pem -key /usr/share/elasticsearch/config/admin-key.pem -cd /usr/share/elasticsearch/plugins/opendistro_security/securityconfig/
  ```

6. Update `lagoon-core-values.yaml` with:

  ```yaml title="lagoon-core-values.yaml"
  elasticsearchURL: http://elasticsearch-opendistro-es-client-service.elasticsearch.svc.cluster.local:9200
  kibanaURL: https://<<Kibana Public URL>>
  logsDBAdminPassword: "<<PlainText Elasticsearch Admin Password>>"
  ```

7. Rollout Lagoon Core:

  ```bash title="Rollout Lagoon Core"
  helm upgrade --install --create-namespace --namespace lagoon-core -f values.yaml lagoon-core lagoon/lagoon-core
  ```

9. Sync all Lagoon Groups with Opendistro Elasticsearch

  ```bash title="Sync groups"
  kubectl -n lagoon-core exec -it deploy/lagoon-core-api -- sh
  yarn run sync:opendistro-security
  ```
