## Local Lagoon Makefile
.DEFAULT_GOAL := help

.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'


# Local environment
ARCH := $(shell uname | tr '[:upper:]' '[:lower:]')
LAGOON_VERSION := $(shell git describe --tags --exact-match 2>/dev/null || echo development)
DOCKER_DRIVER := $(shell docker info -f '{{.Driver}}')

print-%: ; @echo $*=$($*)
GREEN=\033[0;32m
NC=\033[0m


# Run all
.PHONY: all
all: setup install get-admin-creds


# Setup
.PHONY: setup
setup: create-kind-network replace-kind-ip create-kind-cluster

# Create kind network
.PHONY: create-kind-network
create-kind-network:
	docker network inspect kind > /dev/null || docker network create --ip-range=172.17.0.0/24 --subnet=172.17.0.0/16 kind \
	&& docker run --rm --network kind alpine ip -o addr show eth0 | sed -nE 's/.* ([0-9.]{7,})\/.*/\1/p'

## Prepare local.yaml with kind ip address
#  Replaces example kind addresses in folder with the new kind network ip
#
#  Note: on Mac 'sed' requires a suffix for '-i' flag
.PHONY: replace-kind-ip
replace-kind-ip:
	KIND_NODE_IP=$$(docker run --rm --network kind alpine ip -o addr show eth0 | sed -nE 's/.* ([0-9.]{7,})\/.*/\1/p') \
	&& find . -type f ! -name 'Makefile' | xargs sed -i '' "s/172.17.0.2/$$KIND_NODE_IP/g"

## Setup kind cluster
.PHONY: create-kind-cluster
create-kind-cluster:
	cd ../ && kind create cluster --wait=120s --config=helmvalues/kind-config.yaml


# Install charts
.PHONY: install
install: install-helm-dependencies install-cluster-prerequisites install-lagoon replace-build-deploy-token install-tests

.PHONY: install-helm-dependencies
install-helm-dependencies:
	helm plugin install https://github.com/aslafy-z/helm-git; \
	helm repo add harbor https://helm.goharbor.io; \
	helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx; \
	helm repo add stable https://charts.helm.sh/stable; \
	helm repo add bitnami https://charts.bitnami.com/bitnami; \
	helm repo add minio https://helm.min.io/; \
	helm repo add amazeeio https://amazeeio.github.io/charts/; \
	helm repo add lagoon https://uselagoon.github.io/lagoon-charts/; \
	helm repo update

.PHONY: install-cluster-prerequisites
install-cluster-prerequisites:
	helm upgrade --install --create-namespace --namespace \
		ingress-nginx \
		--wait \
		--timeout 30m \
		--version 3.40.0 \
		ingress-nginx \
		ingress-nginx/ingress-nginx -f ingress-nginx.yaml; \
	helm upgrade --install --create-namespace --namespace \
		registry \
		--wait \
		--timeout 30m \
  	--version 1.5.6 \
		registry \
		harbor/harbor -f registry.yaml; \
	helm upgrade --install --create-namespace --namespace \
		nfs-server-provisioner \
		--wait \
		--timeout 30m \
		--version 1.1.3 \
		nfs-server-provisioner \
		stable/nfs-server-provisioner -f nfs-server-provisioner.yaml; \
	helm upgrade --install --create-namespace --namespace \
		minio --wait \
		--timeout 30m \
		--version 8.1.11 \
		minio \
		bitnami/minio -f minio.yaml

.PHONY: install-dbaas
install-dbaas:
	helm upgrade --install --create-namespace --namespace mariadb --wait --timeout 30m --version=10.1.1 mariadb bitnami/mariadb -f local.yaml; \
	helm upgrade --install --create-namespace --namespace postgresql --wait --timeout 30m --version=10.13.14 postgresql bitnami/postgresql -f local.yaml; \
	helm upgrade --install --create-namespace --namespace mongodb --wait --timeout 30m --version=10.30.6 mongodb bitnami/mongodb -f local.yaml


# Install Lagoon
.PHONY: install-lagoon
install-lagoon: install-lagoon-core install-lagoon-build-deploy install-lagoon-remote ## Install Lagoon

.PHONY: install-lagoon-core
install-lagoon-core: ## Install Lagoon Core
	helm upgrade --install --create-namespace --namespace lagoon --wait --timeout 30m lagoon-core lagoon/lagoon-core -f lagoon-core.yaml -f local.yaml

.PHONY: install-lagoon-build-deploy
install-lagoon-build-deploy: ## Install Lagoon Build Deploy
	helm upgrade --install --create-namespace --namespace lagoon --wait --timeout 30m lagoon-build-deploy lagoon/lagoon-build-deploy -f lagoon-build-deploy.yaml -f local.yaml

.PHONY: install-lagoon-remote
install-lagoon-remote: ## Install Lagoon Remote
	helm upgrade --install --create-namespace --namespace lagoon --wait --timeout 30m lagoon-remote lagoon/lagoon-remote -f lagoon-remote.yaml -f local.yaml


.PHONY: replace-build-deploy-token
replace-build-deploy-token: ## Install Lagoon Remote
	kubectl -n lagoon get secret -o json | jq -r '.items[] | select(.metadata.name | match("lagoon-build-deploy-token")) | .data.token | @base64d' | xargs -S 1000 -I ARGS yq -i eval '.token = "ARGS"' local.yaml



.PHONY: install-tests
install-tests: ## Install and run tests
	helm upgrade --install --create-namespace --namespace lagoon --wait --timeout 30m lagoon-test lagoon/lagoon-test -f lagoon-test.yaml -f local.yaml

.PHONY: run-tests
run-tests: install-tests
	helm test lagoon-test --namespace lagoon


# Clean up
.PHONY: delete-cluster
delete-cluster:
	kind delete cluster --name lagoon-local
ifeq ($(ARCH), darwin)
	docker rm --force lagoon-kind-proxy-32080
endif


.PHONY: get-admin-creds
get-admin-creds:
	@echo "\nGraphQL API admin token: \n${GREEN}$$(docker run \
		-e JWTSECRET="$$(kubectl get secret -n lagoon lagoon-core-secrets -o jsonpath="{.data.JWTSECRET}" | base64 --decode)" \
		-e JWTAUDIENCE=api.dev \
		-e JWTUSER=localadmin \
		uselagoon/tests \
		python3 /ansible/tasks/api/admin_token.py)${NC}" \
	&& echo "\nKeycloak admin password: ${GREEN}" \
	$$(kubectl get secret -n lagoon lagoon-core-keycloak -o jsonpath="{.data.KEYCLOAK_ADMIN_PASSWORD}" | base64 --decode) \
	&& echo "\n${NC}Keycloak password for lagoonadmin user: ${GREEN}" \
	$$(kubectl get secret -n lagoon lagoon-core-keycloak -o jsonpath="{.data.KEYCLOAK_LAGOON_ADMIN_PASSWORD}" | base64 --decode) \
	&& echo "${NC}"
