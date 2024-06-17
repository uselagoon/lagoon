# ラグーンロギング

ラグーンは、アプリケーション、コンテナ、ルーターのログを保存するためにOpenSearchと統合します。ラグーンロギングは、ラグーンプロジェクトからアプリケーション、ルーター、コンテナのログを収集し、それらをログ集約器に送信します。それは各`lagoon-remote` インスタンスにインストールする必要があります。

さらに、それは`lagoon-core`サービスからログを収集するために`lagoon-core`クラスターにインストールするべきです。これは`LagoonLogs`セクションで設定されています。

ロギング概要：[Lucid Chart](https://lucid.app/lucidchart/70f9610e-cfd7-42e8-8b5b-3d03293a439c/view?page=Uq-x~LhSIxrp&invitationId=inv_4e891071-f795-4ada-bbd3-2ff63b8eb1f7#)

参照：[Logging](../logging/logging.md)。

ラグーンロギングについて詳しくはこちらをご覧ください：[https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-logging](https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-logging)

1. `lagoon-logging-values.yaml`を作成します：

    ```yaml title="lagoon-logging-values.yaml"
    tls:
      caCert: |
        << Logs-Concentratorからのca.pemの内容 >>
      clientCert: |
        << Logs-Concentratorからのclient.pemの内容 >>
      clientKey: |
        << Logs-Concentratorからのclient-key.pemの内容 >>
    ```
 転送:
      username: <<Lagoon Remote 1のユーザー名>>
      password: <<Lagoon Remote 1のパスワード>>
      host: <<Logs-Concentrator Service LoadBalancerのExternalIP>>
      hostName: <<Logs-Concentratorのサーバ証明書のホスト名>>
      hostPort: '24224'
      selfHostname: <<Logs-Concentratorのクライアント証明書のホスト名>>
      sharedKey: <<Logs-Concentratorの生成されたForwardSharedKey>>
      tlsVerifyHostname: false
    clusterName: <<短いクラスタ識別子>>
    logsDispatcher:
      serviceMonitor:
        enabled: false
    logging-operator:
      monitoring:
        serviceMonitor:
          enabled: false
    lagoonLogs:
      enabled: true
      rabbitMQHost: lagoon-core-broker.lagoon-core.svc.cluster.local
      rabbitMQUser: lagoon
      rabbitMQPassword: <<RabbitMQ Lagoon パスワード>>
    excludeNamespaces: {}
    ```

2. `lagoon-logging`をインストールします:

    ```bash title="Install lagoon-logging"
    helm repo add banzaicloud-stable https://kubernetes-charts.banzaicloud.com

    helm upgrade --install --create-namespace \
      --namespace lagoon-logging \
      -f lagoon-logging-values.yaml \
      lagoon-logging lagoon/lagoon-logging
    ```

## Logging NGINX In gressコントローラ

`lagoon-logging`内の`ingress-nginx`からログが必要な場合：

1. ingressコントローラは`ingress-nginx`という名前空間にインストールされていなければなりません
2. このファイルの内容を`ingress-nginx`に追加します：

    ```yaml title="ingress-nginx log-format-upstream"
    controller:
      config:
        log-format-upstream: >-
          {
          "time": "$time_iso8601",
          "remote_addr": "$remote_addr",
          "x-forwarded-for": "$http_x_forwarded_for",
          "true-client-ip": "$http_true_client_ip",
          "req_id": "$req_id",
          "remote_user": "$remote_user",
          "bytes_sent": $bytes_sent,
          "request_time": $request_time,
          "status": "$status",
          "host": "$host",
          "request_proto": "$server_protocol",
          "request_uri": "$uri",
          "request_query": "$args",
          "request_length": $request_length,
          "request_time": $request_time,
          "request_method": "$request_method",
          "http_referer": "$http_referer",
          "http_user_agent": "$http_user_agent",
          "namespace": "$namespace",
          "ingress_name": "$ingress_name",
          "service_name": "$service_name",           "service_port": "$service_port"
          }
    ```

3. あなたのログが流れ始めるはずです！