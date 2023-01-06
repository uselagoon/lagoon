# Lagoon Logging

Lagoon integrates with OpenSearch to store application, container and router logs. Lagoon Logging collects the application, router and container logs from Lagoon projects, and sends them to the logs concentrator.  It needs to be installed onto each `lagoon-remote` instance.

In addition, it should be installed in the `lagoon-core` cluster to collect logs from the `lagoon-core` service.  This is configured in the `LagoonLogs` section.

Logging Overview: [https://lucid.app/lucidchart/b1da011f-2b91-4798-9518-4164b19d327d/view](https://lucid.app/lucidchart/b1da011f-2b91-4798-9518-4164b19d327d/view)

See also: [Logging](../logging/logging.md).

Read more about Lagoon logging here: [https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-logging](https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-logging)

1. Create `lagoon-logging-values.yaml`:

    ```yaml title="lagoon-logging-values.yaml"
    tls:
      caCert: |
        << content of ca.pem from Logs-Concentrator>>
      clientCert: |
        << content of client.pem from Logs-Concentrator>>
      clientKey: |
        << content of client-key.pem from Logs-Concentrator>>
    forward:
      username: <<Username for Lagoon Remote 1>>
      password: <<Password for Lagoon Remote 1>>
      host: <<ExternalIP of Logs-Concentrator Service LoadBalancer>>
      hostName: <<Hostname in Server Cert of Logs-Concentrator>>
      hostPort: '24224'
      selfHostname: <<Hostname in Client Cert of Logs-Concentrator>>
      sharedKey: <<Generated ForwardSharedKey of Logs-Concentrator>>
      tlsVerifyHostname: false
    clusterName: <<Short Cluster Identifier>>
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
      rabbitMQPassword: <<RabbitMQ Lagoon Password>>
    excludeNamespaces: {}
    ```

2. Install `lagoon-logging`:

    ```
    helm repo add banzaicloud-stable https://kubernetes-charts.banzaicloud.com

    helm upgrade --install --create-namespace \
      --namespace lagoon-logging \
      -f lagoon-logging-values.yaml \
      lagoon-logging lagoon/lagoon-logging
    ```

## Logging NGINX Ingress Controller

If you'd like logs from `ingress-nginx` inside `lagoon-logging`:

1. The ingress controller must be installed in the namespace `ingress-nginx`
2. Add the content of this file to ingress-nginx:

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
          "service_name": "$service_name",
          "service_port": "$service_port"
          }
    ```
3. Your logs should start flowing!
