# Installation inside k8s

### Lagoon Core

```text
helm repo add https://uselagoon.github.io/lagoon-charts/
```

example values.yaml

```text
elasticsearchHost: https://none.com
harborURL: "https://none.com"
harborAdminPassword: none
kibanaURL: https://none.com
logsDBAdminPassword: none
s3FilesAccessKeyID: none
s3FilesBucket: none
s3FilesHost: none
s3FilesSecretAccessKey: none
s3BAASAccessKeyID: none
s3BAASSecretAccessKey: none
imageTag: main
registry: none.com

api:
  ingress:
    enabled: true
    annotations:
      kubernetes.io/tls-acme: "true"
    hosts:
    - host: api.lagoon.example.com
      paths:
      - /
    tls:
      - secretName: api-tls
        hosts:
          - api.lagoon.example.com

keycloak:
  ingress:
    enabled: true
    annotations:
      kubernetes.io/tls-acme: "true"
    hosts:
    - host: keycloak.lagoon.example.com
      paths:
      - /
    tls:
      - secretName: keycloak-tls
        hosts:
          - keycloak.lagoon.example.com

webhookHandler:
  ingress:
    enabled: true
    annotations:
      kubernetes.io/tls-acme: "true"
    hosts:
    - host: webhookhandler.lagoon.example.com
      paths:
      - /
    tls:
      - secretName: webhookhandler-tls
        hosts:
          - webhookhandler.lagoon.example.com

ui:
  ingress:
    enabled: true
    annotations:
      kubernetes.io/tls-acme: "true"
    hosts:
    - host: ui.lagoon.example.com
      paths:
      - /
    tls:
      - secretName: ui-tls
        hosts:
          - ui.lagoon.example.com

backupHandler:
  ingress:
    enabled: true
    annotations:
      kubernetes.io/tls-acme: "true"
    hosts:
    - host: backuphandler.lagoon.example.com
      paths:
      - /
    tls:
      - secretName: backuphandler-tls
        hosts:
          - backuphandler.lagoon.example.com

drushAlias:
  ingress:
    enabled: true
    annotations:
      kubernetes.io/tls-acme: "true"
    hosts:
    - host: drushalias.lagoon.example.com
      paths:
      - /
    tls:
      - secretName: drushalias-tls
        hosts:
          - drushalias.lagoon.example.com

ssh:
  service:
    type: LoadBalancer
    port: 22


broker:
  ingress:
    enabled: true
    annotations:
      kubernetes.io/tls-acme: "true"
    hosts:
    - host: broker.lagoon.example.com
      paths:
      - /
    tls:
      - secretName: broker-tls
        hosts:
          - broker.lagoon.example.com

webhookHandler:
  ingress:
    enabled: true
    annotations:
      kubernetes.io/tls-acme: "true"
    hosts:
    - host: webhookhandler.lagoon.example.com
      paths:
      - /
    tls:
      - secretName: webhookhandler-tls
        hosts:
          - webhookhandler.lagoon.example.com

```

