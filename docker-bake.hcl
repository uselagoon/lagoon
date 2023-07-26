# docker-bake.dev.hcl
variable "REPO" {
  default = "ghcr.io/tobybellwood"
}

variable "TAG" {
  default = "bake"
}

variable "LAGOON_VERSION" {
  default = "development"
}

variable "PLATFORMS" {
  // use PLATFORMS=linux/amd64,linux/arm64 to override default single architecture on the cli
  default = "linux/amd64"
}

target "default"{
  platforms = ["${PLATFORMS}"]
  dockerfile = "Dockerfile"
  labels = {
    "org.opencontainers.image.source": "https://github.com/uselagoon/lagoon",
    "org.opencontainers.image.url": "https://github.com/uselagoon/lagoon",
    "org.opencontainers.image.description": "The system services needed to run a lagoon-core in production and locally",
    "org.opencontainers.image.licenses": "Apache 2.0",
    "org.opencontainers.image.version": "${LAGOON_VERSION}",
    "repository": "https://github.com/uselagoon/lagoon"
  }
  args = {
    LAGOON_VERSION = "${LAGOON_VERSION}"
  }
}

group "default" {
  targets = [
    "actions-handler",
    "api-db",
    "api-redis",
    "api",
    "auth-server",
    "backup-handler",
    "broker-single",
    "broker",
    "keycloak-db",
    "keycloak",
    "local-api-data-watcher-pusher",
    "local-dbaas-provider",
    "local-git",
    "local-mongodb-dbaas-provider",
    "local-registry",
    "logs2notifications",
    "ssh",
    "task-activestandby",
    "tests",
    "webhook-handler",
    "webhooks2tasks",
    "workflows"
  ]
}

group "ui-logs-development" {
  targets = [
    "actions-handler",
    "api-db",
    "api-redis",
    "api",
    "broker-single",
    "keycloak-db",
    "keycloak",
    "local-api-data-watcher-pusher",
    "logs2notifications"
  ]
}

group "local-dev" {
  targets = [
    "local-api-data-watcher-pusher",
    "local-dbaas-provider",
    "local-git",
    "local-mongodb-dbaas-provider",
    "local-registry",
  ]
}

group "prod-images" {
  targets = [
    "actions-handler",
    "api-db",
    "api-redis",
    "api",
    "auth-server",
    "backup-handler",
    "broker-single",
    "broker",
    "keycloak-db",
    "keycloak",
    "logs2notifications",
    "ssh",
    "task-activestandby",
    "tests",
    "webhook-handler",
    "webhooks2tasks",
    "workflows"
  ]
}

target "yarn-workspace-builder" {
  inherits = ["default"]
  context = "."
  dockerfile = "yarn-workspace-builder/Dockerfile"
}

target "api" {
  inherits = ["default"]
  context = "services/api"
  contexts = {
    "lagoon/yarn-workspace-builder": "target:yarn-workspace-builder"
  }
  labels = {
    "org.opencontainers.image.title": "lagoon-core/api - the API service for Lagoon"
  }
  tags = ["${REPO}/api:${TAG}"]
}

target "api-db" {
  inherits = ["default"]
  context = "services/api-db"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/api-db - the MariaDB database service for Lagoon API"
  }
  tags = ["${REPO}/api-db:${TAG}"]
}

target "api-redis" {
  inherits = ["default"]
  context = "services/api-redis"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/api-redis - the Redis service for Lagoon API"
  }
  tags = ["${REPO}/api-redis:${TAG}"]
}

target "actions-handler" {
  inherits = ["default"]
  context = "services/actions-handler"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/actions-handler - the actions-handler service for Lagoon"
  }
  tags = ["${REPO}/actions-handler:${TAG}"]
}

target "auth-server" {
  inherits = ["default"]
  context = "services/auth-server"
  contexts = {
    "lagoon/yarn-workspace-builder": "target:yarn-workspace-builder"
  }
  labels = {
    "org.opencontainers.image.title": "lagoon-core/auth-server - the auth-server service for Lagoon"
  }
  tags = ["${REPO}/auth-server:${TAG}"]
}

target "backup-handler" {
  inherits = ["default"]
  context = "services/backup-handler"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/backup-handler - the backup-handler service for Lagoon"
  }
  tags = ["${REPO}/backup-handler:${TAG}"]
}

target "broker-single" {
  inherits = ["default"]
  context = "services/broker-single"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/broker-single - the RabbitMQ broker standalone service for Lagoon"
  }
  tags = ["${REPO}/broker-single:${TAG}"]
}

target "broker" {
  inherits = ["default"]
  context = "services/broker"
  contexts = {
    "lagoon/broker-single": "target:broker-single"
  }
  labels = {
    "org.opencontainers.image.title": "lagoon-core/broker - the RabbitMQ broker service for Lagoon"
  }
  tags = ["${REPO}/broker:${TAG}"]
}

target "keycloak" {
  inherits = ["default"]
  context = "services/keycloak"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/keycloak - the Keycloak service for Lagoon"
  }
  tags = ["${REPO}/keycloak:${TAG}"]
}

target "keycloak-db" {
  inherits = ["default"]
  context = "services/keycloak-db"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/keycloak-db - the MariaDB database service for Lagoon Keycloak"
  }
  tags = ["${REPO}/keycloak-db:${TAG}"]
}

target "logs2notifications" {
  inherits = ["default"]
  context = "services/logs2notifications"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/logs2notifications - the logs2notifications service for Lagoon"
  }
  tags = ["${REPO}/logs2notifications:${TAG}"]
}

target "ssh" {
  inherits = ["default"]
  context = "."
  dockerfile = "services/ssh/Dockerfile"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/ssh - the ssh service for Lagoon"
  }
  tags = ["${REPO}/ssh:${TAG}"]
  // Note not currently arm64 compatible, libnss is waaaay too old
  platforms = ["linux/amd64"]
}

target "tests" {
  inherits = ["default"]
  context = "tests"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/tests - the tests image for Lagoon"
  }
  tags = ["${REPO}/tests:${TAG}"]
}

target "webhook-handler" {
  inherits = ["default"]
  context = "services/webhook-handler"
  contexts = {
    "lagoon/yarn-workspace-builder": "target:yarn-workspace-builder"
  }
  labels = {
    "org.opencontainers.image.title": "lagoon-core/webhook-handler - the webhook-handler service for Lagoon"
  }
  tags = ["${REPO}/webhook-handler:${TAG}"]
}

target "webhooks2tasks" {
  inherits = ["default"]
  context = "services/webhooks2tasks"
  contexts = {
    "lagoon/yarn-workspace-builder": "target:yarn-workspace-builder"
  }
  labels = {
    "org.opencontainers.image.title": "lagoon-core/webhooks2tasks - the webhooks2tasks service for Lagoon"
  }
  tags = ["${REPO}/webhooks2tasks:${TAG}"]
}

target "workflows" {
  inherits = ["default"]
  context = "services/workflows"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/workflows - the workflows service for Lagoon"
  }
  tags = ["${REPO}/workflows:${TAG}"]
}

target "task-activestandby" {
  inherits = ["default"]
  context = "taskimages/activestandby"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/task-activestandby - the active/standby task image for Lagoon"
  }
  tags = ["${REPO}/task-activestandby:${TAG}"]
}

target "local-api-data-watcher-pusher" {
  inherits = ["default"]
  context = "local-dev/api-data-watcher-pusher"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/local-api-data-watcher-pusher - the local-dev data pusher image for Lagoon"
  }
  tags = ["${REPO}/local-api-data-watcher-pusher:${TAG}"]
}

target "local-dbaas-provider" {
  inherits = ["default"]
  context = "local-dev/dbaas-provider"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/local-dbaas-provider - the local-dev MariaDB DBaaS image for Lagoon"
  }
  tags = ["${REPO}/local-dbaas-provider:${TAG}"]
}

target "local-git" {
  inherits = ["default"]
  context = "local-dev/git"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/local-git - the local-dev Git repository image for Lagoon"
  }
  tags = ["${REPO}/local-git:${TAG}"]
}

target "local-mongodb-dbaas-provider" {
  inherits = ["default"]
  context = "local-dev/mongodb-dbaas-provider"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/local-mongodb-dbaas-provider - the local-dev MongoDB DBaaS image for Lagoon"
  }
  tags = ["${REPO}/local-mongodb-dbaas-provider:${TAG}"]
}

target "local-registry" {
  inherits = ["default"]
  context = "local-dev/registry"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/local-registry - the local-dev Docker registry image for Lagoon"
  }
  tags = ["${REPO}/local-registry:${TAG}"]
}
