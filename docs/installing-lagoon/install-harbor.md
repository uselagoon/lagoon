# Install Harbor

1. Add Helm repo: `helm repo add harbor https://helm.goharbor.io`
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

1. Install Harbor:`helm upgrade --install --create-namespace --namespace harbor --wait -f harbor-values.yaml --version=1.5.2 harbor harbor/harbor`
   1. We are currently using Harbor version 1.5.2. A recent update to Harbor breaks the API.
2. Visit Harbor at the URL you set in `harbor.yml`.
   1. Username: admin
   2. Password:
       `kubectl -n harbor get secret harbor-harbor-core -o jsonpath="{.data.HARBOR_ADMIN_PASSWORD}" | base64 --decode`
3. Add the above Harbor credentials to the Lagoon Core `values.yml` that you created at the beginning of the process, as well as `harbor-values.yml`.&#x20;
4. Upgrade lagoon-core release with the updated `values.yml` file: `helm upgrade --namespace lagoon-core -f values.yaml lagoon-core lagoon/lagoon-core`
