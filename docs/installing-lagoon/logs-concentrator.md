# Logs-Concentrator

Logs-concentrator collects the logs being sent by Lagoon clusters and augments them with additional metadata before inserting them into Elasticsearch.

1. Create certificates according to ReadMe: [https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-logs-concentrator](https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-logs-concentrator)
2. Create `logs-concentrator-values.yml`:

    ```yaml title="logs-concentrator-values.yml"
    tls:
      caCert: |
        <<contents of ca.pem>>
      serverCert: |
        <<contents of server.pem
      serverKey: |
        <<contents of server-key.pem>>
    elasticsearchHost: elasticsearch-opendistro-es-client-service.elasticsearch.svc.cluster.local
    elasticsearchAdminPassword: <<ElasticSearch Admin Password>>
    forwardSharedKey: <<Random 32 Character Password>>
    users:
      - username: <<Username for Lagoon Remote 1>>
        password: <<Random Password for Lagoon Remote 1>>
    service:
      type: LoadBalancer
    serviceMonitor:
      enabled: false
    ```

3.  Install logs-concentrator:

    ```bash title="Install logs-concentrator"
    helm upgrade --install --create-namespace \
      --namespace lagoon-logs-concentrator \
      -f logs-concentrator-values.yaml \
      lagoon-logs-concentrator lagoon/lagoon-logs-concentrator
    ```
