# OpenDistro

OpenDistroクラスタをインストールするには、Lagoonがそれと安全に通信できるようにTLSとシークレットを設定する必要があります。いくつかのJSONファイルを作成する必要があります - これらを、インストールプロセス全体を通じて作成してきた値のファイルと同じディレクトリに置いてください。

OpenDistro Helmをインストールします。詳細は[https://opendistro.github.io/for-elasticsearch-docs/docs/install/helm/](https://opendistro.github.io/for-elasticsearch-docs/docs/install/helm/)を参照してください。

## キーと証明書の作成

1. 証明書の生成

   !!! 注意 "注意:"
       _CFSSLはCloudFlareのPKI/TLSスイスアーミーナイフです。これはコマンドラインツールであり、TLS証明書の署名、検証、バンドル化を行うHTTP APIサーバです。ビルドにはGo 1.12+が必要です。_

   1. CFSSLをインストールします: [https://github.com/cloudflare/cfssl](https://github.com/cloudflare/cfssl)
   2. CAを生成します。次のファイルが必要です:

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

1. 次の2つのコマンドを実行します :

  ```bash title="証明書の生成"
  cfssl gencert -initca ca-csr.json | cfssljson -bare ca -
  rm ca.csr
  ```

  `ca-key.pem`と`ca.pem`が生成されます。これがあなたのCAキーと自己署名証明書です。

3. 次に、ノードのピーリング証明書を生成します。次の2つのファイルが必要です：

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

4. 次の2つのコマンドを実行します：

  ```bash title="証明書キーの生成"
  cfssl gencert -ca=ca.pem -ca -キー=ca-key.pem -config=ca-config.json -profile=peer node.json | cfssljson -bare node
  rm node.csr
  ```

  `node.pem`と`node-key.pem`が得られます。これがESクラスターのノードで使用されるピア証明書になります。

5. 次に、以下のコマンドでキーをJavaがサポートする形式に変換します：

  ```bash title="キー形式の変換"
  openssl pkey -in node-key.pem -out node-key.pkcs8
  ```

6. 次に、管理者証明書を生成します。次のファイルが必要です：

  ```json title="admin.json"
  {
    "CN": "admin.elasticsearch.svc.cluster.local",
    "key": {
      "algo": "ecdsa",
      "size": 256
    }
  }
  ```

7. 次の2つのコマンドを実行します：

  ```bash title="管理者証明書キーの生成"
  cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=client admin.json | cfssljson -bare admin
  rm admin.csr
  ```

  `admin.pem`と`admin-key.pem`が得られます。これがopendistro-securityプラグインで管理コマンドを実行するために使用される証明書になります。

8. 次に、以下のコマンドでキーをJavaがサポートする形式に変換します：

  ```bash title="キー形式の変換"
  openssl pkey -in admin-key.pem -out admin -key.pkcs8
  ```

## OpenDistroのインストール

キーと証明書を手に入れたので、インストールを続けることができます。

1. ハッシュ化されたパスワードを生成します。
   1. `elasticsearch-secrets-values.yaml`には2つのハッシュ化されたパスワードが必要です。以下のコマンドでそれらを作成します（2回実行し、ランダムなパスワードを入力し、プレーンテキストとハッシュ化されたパスワードの両方を保存します）。

  ```bash title="ハッシュ化されたパスワードを生成"
  docker run --rm -it docker.io/amazon/opendistro-for-elasticsearch:1.12.0 sh -c "chmod +x /usr/share/elasticsearch/plugins/opendistro_security/tools/hash.sh; /usr/share/elasticsearch/plugins/opendistro_security/tools/hash.sh"
  ```

1. secretsを作成します:

  1. `elasticsearch-secrets-values.yaml`を作成する必要があります。このgistを参考にしてください：[https://gist.github.com/Schnitzel/43f483dfe0b23ca0dddd939b12bb4b0b](https://gist.github.com/Schnitzel/43f483dfe0b23ca0dddd939b12bb4b0b)

2. 以下のコマンドでsecretsをインストールします:

  ```bash title="secretsのインストール"
  helm repo add incubator https://charts.helm.sh/incubator`
  helm upgrade --namespace elasticsearch --create-namespace --install elasticsearch-secrets incubator/raw --values elasticsearch-secrets-values.yaml `
  ```

3. あなたは必要とするでしょう `elasticsearch-values.yaml`を作成します。例としてこのgistを参照してください：（すべての<\<Placeholders>>に値を埋めてください）[https://gist.github.com/Schnitzel/1e386654b6abf75bf4d66a544db4aa6a](https://gist.github.com/Schnitzel/1e386654b6abf75bf4d66a544db4aa6a)
4. Elasticsearchをインストール：

  ```bash title="Elasticsearchをインストール"
  helm upgrade --namespace elasticsearch --create-namespace --install elasticsearch opendistro-es-X.Y.Z.tgz --values elasticsearch-values.yaml
  ```

5. Elasticsearch内のセキュリティを次のように設定：

  ```bash title="セキュリティを設定"
  kubectl exec -n elasticsearch -it elasticsearch-opendistro-es-master-0 -- bash
  chmod +x /usr/share/elasticsearch/plugins/opendistro_security/tools/securityadmin.sh
  /usr/share/elasticsearch/plugins/opendistro_security/tools/securityadmin.sh -nhnv -cacert /usr/share/elasticsearch/config/admin-root-ca.pem -cert /usr/share/elasticsearch/config/admin-crt.pem -key /usr/share/elasticsearch/config/admin-key.pem -cd /usr/share/elasticsearch/plugins/opendistro_security/securityconfig/
  ```

6. `lagoon-core-values.yaml`を次のように更新：

  ```yaml title="lagoon-core-values.yaml"
  elasticsearchURL: http://elasticsearch-opendistro-es -client-service.elasticsearch.svc.cluster.local:9200
  kibanaURL: https://<<Kibana Public URL>>
  logsDBAdminPassword: "<<PlainText Elasticsearch Admin Password>>"
  ```

7. ロールアウトLagoon Core：

  ```bash title="Rollout Lagoon Core"
  helm upgrade --install --create-namespace --namespace lagoon-core -f values.yaml lagoon-core lagoon/lagoon-core
  ```

9. すべてのLagoonグループをOpendistro Elasticsearchと同期させる

  ```bash title="Sync groups"
  kubectl -n lagoon-core exec -it deploy/lagoon-core-api -- sh
  yarn run sync:opendistro-security
  ```