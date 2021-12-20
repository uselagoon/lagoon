
# Find the IP address for the KinD network - replace this in all the helmvalues files (should be 192.168.224.2 or similar)
docker network create kind || true && docker run --rm --network kind alpine ip -o addr show eth0 | sed -nE 's/.* ([0-9.]{7,})\/.*/\1/p'

# Create the cluster
kind create cluster --wait=120s --config=helmvalues/kind-config.yaml

# Set up kubectx and kubens (or similar)
kubectx kind-lagoon && kubens default

# Install/Update all necessary Helm repositories
helm repo add harbor https://helm.goharbor.io
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add stable https://charts.helm.sh/stable
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add minio https://helm.min.io/
helm repo add amazeeio https://amazeeio.github.io/charts/
helm repo add lagoon https://uselagoon.github.io/lagoon-charts/
helm repo update


# Install the prerequisites
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

# Need a token
kubectl -n lagoon get secret -o json | jq -r '.items[] | select(.metadata.name | match("lagoon-build-deploy-token")) | .data.token | @base64d'
kubectl -n lagoon get secret lagoon-core-keycloak -o json | jq -r '.data.KEYCLOAK_AUTH_SERVER_CLIENT_SECRET | @base64d'

# Install the testing components and run the tests (default is nginx tests) - if you change the tests, you need to run both helm commands
helm upgrade --install --create-namespace --namespace lagoon --wait --timeout 30m lagoon-test lagoon/lagoon-test -f helmvalues/lagoon-test.yaml -f helmvalues/local.yaml
helm test lagoon-test --namespace lagoon

DOCKER_SCAN_SUGGEST=false docker buildx build --quiet --build-arg LAGOON_VERSION=development --build-arg IMAGE_REPO=lagoon  --build-arg UPSTREAM_REPO=uselagoon --build-arg UPSTREAM_TAG=latest --output=type=image,push=true,registry.insecure=true -t registry.192.168.224.2.nip.io:32080/library/lagoon/tests:latest -f tests/Dockerfile tests