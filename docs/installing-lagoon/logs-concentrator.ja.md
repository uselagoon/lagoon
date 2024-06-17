# ログ集約器

ログ集約器は、Lagoonクラスタから送信されるログを収集し、それらに追加のメタデータを付加してからElasticsearchに挿入します。

1. ReadMeに従って証明書を作成します：[https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-logs-concentrator](https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-logs-concentrator)
2. `logs-concentrator-values.yml`を作成します：

    ```yaml title="logs-concentrator-values.yml"
    tls:
      caCert: |
        <<ca.pemの内容>>
      serverCert: |
        <<server.pemの内容
      serverKey: |
        <<server-key.pemの内容>>
    elasticsearchHost: elasticsearch-opendistro-es-client-service.elasticsearch.svc.cluster.local
    elasticsearchAdminPassword: <<ElasticSearch管理者パスワード>>
    forwardSharedKey: <<ランダムな32文字のパスワード>>
    users:
      - username: <<Lagoonリモート1のユーザー名>>
        password: <<Lagoonリモート1のランダムパスワード>>
    service:
      type: LoadBalancer
    serviceMonitor:
      enabled: false
    ```

3.  ログ集約器をインストールします：

    ```bash title="Install logs-concentrator"
    helm upgrade --install --create-namespace ```
      --namespace lagoon-logs-concentrator \
      -f logs-concentrator-values.yaml \
      lagoon-logs-concentrator lagoon/lagoon-logs-concentrator
    ```
このテキストはプログラミングコードであり、特定のプログラミング言語に依存しているため、翻訳は適用されません。