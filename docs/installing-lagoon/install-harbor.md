# Install Harbor

1. Add Helm repo:
    ```bash
    helm repo add harbor https://helm.goharbor.io
    ```
2. Create the file `harbor-values.yml` inside of your config directory:

    ```yaml title="harbor-values.yml"
    expose:
      ingress:
        annotations:
          kubernetes.io/tls-acme: "true"
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
2. Visit Harbor at the URL you set in `harbor.yml`.
   1. Username: admin
   2. Password:
       ```bash
       kubectl -n harbor get secret harbor-core -o jsonpath="{.data.HARBOR_ADMIN_PASSWORD}" | base64 --decode
       ```
3. You will need to add the above Harbor credentials to the Lagoon Remote `values.yml` in the next step, as well as `harbor-values.yml`.
