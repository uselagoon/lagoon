# Install Harbor

1. Add Helm repo:
    ```bash
    helm repo add harbor https://helm.goharbor.io
    ```
1. Create the file `harbor-values.yml` inside of your config directory. The proxy-buffering annotations help with large image pushes.:

    ```yaml title="harbor-values.yml"
    expose:
      ingress:
        annotations:
          kubernetes.io/tls-acme: "true"
          nginx.ingress.kubernetes.io/proxy-buffering: "off"
          nginx.ingress.kubernetes.io/proxy-request-buffering: "off"
        hosts:
          core: harbor.lagoon.example.com
      tls:
        enabled: true
        certSource: secret
        secret:
          secretName: harbor-harbor-ingress
    externalURL: https://harbor.lagoon.example.com
    harborAdminPassword: <your Harbor Admin Password>
    chartmuseum:
      enabled: false
    clair:
      enabled: false
    notary:
      enabled: false
    trivy:
      enabled: false
    jobservice:
      jobLogger: stdout
    registry:
      replicas: 1

    ```

1. Install Harbor, checking the [requirements](./requirements.md#harbor) for the currently supported Harbor versions.:
    ```bash
    helm upgrade --install --create-namespace \
      --namespace harbor --wait \
      -f harbor-values.yml \
      harbor harbor/harbor
    ```
1. Visit Harbor at the URL you set in `harbor.yml`.
    1. Username: admin
    1. Password:
        ```bash
        kubectl -n harbor get secret harbor-core -o jsonpath="{.data.HARBOR_ADMIN_PASSWORD}" | base64 --decode
        ```
1. You will need to add the above Harbor credentials to the Lagoon Remote `values.yml` in the next step, as well as `harbor-values.yml`.
