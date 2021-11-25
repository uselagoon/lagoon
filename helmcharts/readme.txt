# Install the prerequisites
helm upgrade --install --create-namespace --namespace ingress-nginx --wait --timeout 30m --version 3.31.0 ingress-nginx ingress-nginx/ingress-nginx -f helmcharts/ingress.yaml
helm upgrade --install --create-namespace --namespace registry --wait --timeout 30m --version 1.5.5 registry harbor/harbor -f helmcharts/registry.yaml
helm upgrade --install --create-namespace --namespace nfs-server-provisioner --wait --timeout 30m --version 1.1.3 nfs-server-provisioner stable/nfs-server-provisioner -f helmcharts/nfs-server-provisioner.yaml
helm upgrade --install --create-namespace --namespace minio --wait --timeout 30m --version 8.1.9 minio bitnami/minio -f helmcharts/minio.yaml

# Install the DBaaS databases as required
helm upgrade --install --create-namespace --namespace mariadb --wait --timeout 30m $(kubectl get ns mariadb > /dev/null 2>&1 && echo --set auth.rootPassword=$(kubectl get secret --namespace mariadb mariadb -o json | jq -r '.data."mariadb-root-password" | @base64d')) --version=9.3.13 mariadb bitnami/mariadb
helm upgrade --install --create-namespace --namespace postgresql --wait --timeout 30m $(kubectl get ns postgresql > /dev/null 2>&1 && echo --set postgresqlPassword=$(kubectl get secret --namespace postgresql postgresql -o json | jq -r '.data."postgresql-password" | @base64d')) --version=10.4.8 postgresql bitnami/postgresql
helm upgrade --install --create-namespace --namespace mongodb --wait --timeout 30m $(kubectl get ns mongodb > /dev/null 2>&1 && echo --set auth.rootPassword=$(kubectl get secret --namespace mongodb mongodb -o json | jq -r '.data."mongodb-root-password" | @base64d')) --version=10.16.4 mongodb bitnami/mongodb

# Install the Lagoon components
helm upgrade --install --create-namespace --namespace lagoon --wait --timeout 30m lagoon-core lagoon/lagoon-core -f helmcharts/lagoon-core.yaml
helm upgrade --install --create-namespace --namespace lagoon --wait --timeout 30m lagoon-build-deploy lagoon/lagoon-build-deploy -f helmcharts/lagoon-build-deploy.yaml
helm upgrade --install --create-namespace --namespace lagoon --wait --timeout 30m lagoon-remote lagoon/lagoon-remote -f helmcharts/lagoon-remote.yaml

# Install the testing components and run the tests - if you change the tests, you need to run both helm commands
helm upgrade --install --create-namespace --namespace lagoon --wait --timeout 30m lagoon-test lagoon/lagoon-test -f helmcharts/lagoon-test.yaml
helm test lagoon-test --namespace lagoon


DOCKER_SCAN_SUGGEST=false docker buildx build --quiet --build-arg LAGOON_VERSION=development --build-arg IMAGE_REPO=lagoon  --build-arg UPSTREAM_REPO=uselagoon --build-arg UPSTREAM_TAG=latest --output=type=image,push=true,registry.insecure=true -t registry.192.168.224.2.nip.io:32080/library/lagoon/tests:latest -f tests/Dockerfile tests