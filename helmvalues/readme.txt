
# These steps assume you have tools like helm, kubectl etc all installed.

# Find the IP address for the KinD network - replace this in all the helmvalues files (should be 172.17.0.2 or similar)
docker network create kind || true && docker run --rm --network kind alpine ip -o addr show eth0 | sed -nE 's/.* ([0-9.]{7,})\/.*/\1/p'

# e.g. sample replace command - use the output from above in the second half of the sed command below
find ./helmvalues -type f | xargs sed -i "s/172.17.0.2/172.17.0.2/g"

# Create the cluster
kind create cluster --wait=120s --config=helmvalues/kind-config.yaml

# Optional Set up kubectx and kubens (or similar) - if you have these tools
kubectx kind-lagoon-local && kubens default

# Install/Update all necessary Helm repositories
helm plugin install https://github.com/aslafy-z/helm-git
helm repo add harbor https://helm.goharbor.io
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add stable https://charts.helm.sh/stable
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add minio https://helm.min.io/
helm repo add amazeeio https://amazeeio.github.io/charts/
helm repo add lagoon https://uselagoon.github.io/lagoon-charts/
helm repo update

# Install the cluster prerequisites (currently version pinned)
helm upgrade --install --create-namespace --namespace ingress-nginx --wait --timeout 30m --version 3.40.0 ingress-nginx ingress-nginx/ingress-nginx -f helmvalues/ingress-nginx.yaml
helm upgrade --install --create-namespace --namespace registry --wait --timeout 30m --version 1.5.6 registry harbor/harbor -f helmvalues/registry.yaml
helm upgrade --install --create-namespace --namespace nfs-server-provisioner --wait --timeout 30m --version 1.1.3 nfs-server-provisioner stable/nfs-server-provisioner -f helmvalues/nfs-server-provisioner.yaml
helm upgrade --install --create-namespace --namespace minio --wait --timeout 30m --version 8.1.11 minio bitnami/minio -f helmvalues/minio.yaml

# Install the DBaaS databases as required
helm upgrade --install --create-namespace --namespace mariadb --wait --timeout 30m --version=10.1.1 mariadb bitnami/mariadb -f helmvalues/local.yaml
helm upgrade --install --create-namespace --namespace postgresql --wait --timeout 30m --version=10.13.14 postgresql bitnami/postgresql -f helmvalues/local.yaml
helm upgrade --install --create-namespace --namespace mongodb --wait --timeout 30m --version=10.30.6 mongodb bitnami/mongodb -f helmvalues/local.yaml

# Install the Lagoon components
helm upgrade --install --create-namespace --namespace lagoon --wait --timeout 30m lagoon-core lagoon/lagoon-core -f helmvalues/lagoon-core.yaml -f helmvalues/local.yaml
helm upgrade --install --create-namespace --namespace lagoon --wait --timeout 30m lagoon-build-deploy lagoon/lagoon-build-deploy -f helmvalues/lagoon-build-deploy.yaml -f helmvalues/local.yaml
helm upgrade --install --create-namespace --namespace lagoon --wait --timeout 30m lagoon-remote lagoon/lagoon-remote -f helmvalues/lagoon-remote.yaml -f helmvalues/local.yaml

# Need a token installed into the tests charts to allow it to talk to core
kubectl -n lagoon get secret -o json | jq -r '.items[] | select(.metadata.name | match("lagoon-build-deploy-token")) | .data.token | @base64d' | xargs -I ARGS yq -i eval '.token = "ARGS"' helmvalues/local.yaml

# Install the testing components and run the tests (default is nginx tests) - if you change the tests, you need to run both helm commands
helm upgrade --install --create-namespace --namespace lagoon --wait --timeout 30m lagoon-test lagoon/lagoon-test -f helmvalues/lagoon-test.yaml -f helmvalues/local.yaml
helm test lagoon-test --namespace lagoon

# Use these to get the admin passwords
docker run \
    -e JWTSECRET="$$(kubectl get secret -n lagoon lagoon-core-secrets -o jsonpath="{.data.JWTSECRET}" | base64 --decode)" \
    -e JWTAUDIENCE=api.dev \
    -e JWTUSER=localadmin \
    uselagoon/tests \
    python3 /ansible/tasks/api/admin_token.py
echo $(kubectl get secret -n lagoon lagoon-core-keycloak -o jsonpath="{.data.KEYCLOAK_ADMIN_PASSWORD}" | base64 --decode)
echo $(kubectl get secret -n lagoon lagoon-core-keycloak -o jsonpath="{.data.KEYCLOAK_LAGOON_ADMIN_PASSWORD}" | base64 --decode)

# Use these to delete CRDs from namespaces if they're holding up deletions
kubectl get LagoonTasks -A | awk '{printf "kubectl -n %s patch LagoonTasks %s -p \047{\"metadata\":{\"finalizers\":null}}\047 --type=merge\n", $1, $2}' | bash
kubectl get LagoonBuilds -A | awk '{printf "kubectl -n %s patch LagoonBuilds %s -p \047{\"metadata\":{\"finalizers\":null}}\047 --type=merge\n", $1, $2}' | bash
kubectl get HostMigrations -A | awk '{printf "kubectl -n %s patch HostMigrations %s -p \047{\"metadata\":{\"finalizers\":null}}\047 --type=merge\n", $1, $2}' | bash
kubectl get MariaDBConsumer -A | awk '{printf "kubectl -n %s patch MariaDBConsumer %s -p \047{\"metadata\":{\"finalizers\":null}}\047 --type=merge\n", $1, $2}' | bash
kubectl get MariaDBProvider -A | awk '{printf "kubectl -n %s patch MariaDBProvider %s -p \047{\"metadata\":{\"finalizers\":null}}\047 --type=merge\n", $1, $2}' | bash
kubectl get MongoDBConsumer -A | awk '{printf "kubectl -n %s patch MongoDBConsumer %s -p \047{\"metadata\":{\"finalizers\":null}}\047 --type=merge\n", $1, $2}' | bash
kubectl get MongoDBProvider -A | awk '{printf "kubectl -n %s patch MongoDBProvider %s -p \047{\"metadata\":{\"finalizers\":null}}\047 --type=merge\n", $1, $2}' | bash
kubectl get PostgreSQLConsumer -A | awk '{printf "kubectl -n %s patch PostgreSQLConsumer %s -p \047{\"metadata\":{\"finalizers\":null}}\047 --type=merge\n", $1, $2}' | bash
kubectl get PostgreSQLProvider -A | awk '{printf "kubectl -n %s patch PostgreSQLProvider %s -p \047{\"metadata\":{\"finalizers\":null}}\047 --type=merge\n", $1, $2}' | bash

# Use build-and-push from the root dir to wrap around make build and push the resulting image up to the harbor
./helmvalues/build-and-push.sh kubectl-build-deploy-dind


# Note: If you are using mac and the registry is timing out, then make sure you have added the external harbor address to your list of insecure registries on Docker for Mac (under Preferences > Docker Engine). For example:

"insecure-registries": [
  "registry.172.17.0.3.nip.io:32080"
],
