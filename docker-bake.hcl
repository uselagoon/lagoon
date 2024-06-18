# docker-bake.dev.hcl
variable "IMAGE_REPO" {
  default = "ghcr.io/uselagoon"
}

variable "TAG" {
  default = "latest"
}

variable "LAGOON_VERSION" {
  default = "development"
}

variable "UPSTREAM_REPO" {
  default = "uselagoon"
}

variable "UPSTREAM_TAG" {
  default = "latest"
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
    UPSTREAM_REPO = "${UPSTREAM_REPO}"
    UPSTREAM_TAG = "${UPSTREAM_TAG}"
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
    "broker",
    "api-sidecar-handler",
    "keycloak-db",
    "keycloak",
    "local-api-data-watcher-pusher",
    "local-git",
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
    "broker",
    "api-sidecar-handler",
    "keycloak-db",
    "keycloak",
    "local-api-data-watcher-pusher",
    "logs2notifications"
  ]
}

group "local-dev" {
  targets = [
    "local-api-data-watcher-pusher",
    "local-git"
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
    "broker",
    "api-sidecar-handler",
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
  tags = ["${IMAGE_REPO}/api:${TAG}"]
}

target "api-db" {
  inherits = ["default"]
  context = "services/api-db"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/api-db - the MariaDB database service for Lagoon API"
  }
  tags = ["${IMAGE_REPO}/api-db:${TAG}"]
}

target "api-redis" {
  inherits = ["default"]
  context = "services/api-redis"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/api-redis - the Redis service for Lagoon API"
  }
  tags = ["${IMAGE_REPO}/api-redis:${TAG}"]
}

target "actions-handler" {
  inherits = ["default"]
  context = "services/actions-handler"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/actions-handler - the actions-handler service for Lagoon"
  }
  tags = ["${IMAGE_REPO}/actions-handler:${TAG}"]
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
  tags = ["${IMAGE_REPO}/auth-server:${TAG}"]
}

target "backup-handler" {
  inherits = ["default"]
  context = "services/backup-handler"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/backup-handler - the backup-handler service for Lagoon"
  }
  tags = ["${IMAGE_REPO}/backup-handler:${TAG}"]
}

target "broker" {
  inherits = ["default"]
  context = "services/broker"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/broker - the RabbitMQ broker service for Lagoon"
  }
  tags = ["${IMAGE_REPO}/broker:${TAG}"]
}

target "api-sidecar-handler" {
  inherits = ["default"]
  context = "services/api-sidecar-handler"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/api-sidecar-handler - the api-sidecar-handler service for Lagoon"
  }
  tags = ["${IMAGE_REPO}/api-sidecar-handler:${TAG}"]
}

target "keycloak" {
  inherits = ["default"]
  context = "services/keycloak"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/keycloak - the Keycloak service for Lagoon"
  }
  tags = ["${IMAGE_REPO}/keycloak:${TAG}"]
}

target "keycloak-db" {
  inherits = ["default"]
  context = "services/keycloak-db"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/keycloak-db - the MariaDB database service for Lagoon Keycloak"
  }
  tags = ["${IMAGE_REPO}/keycloak-db:${TAG}"]
}

target "logs2notifications" {
  inherits = ["default"]
  context = "services/logs2notifications"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/logs2notifications - the logs2notifications service for Lagoon"
  }
  tags = ["${IMAGE_REPO}/logs2notifications:${TAG}"]
}

target "ssh" {
  inherits = ["default"]
  context = "."
  dockerfile = "services/ssh/Dockerfile"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/ssh - the ssh service for Lagoon"
  }
  tags = ["${IMAGE_REPO}/ssh:${TAG}"]
}

target "tests" {
  inherits = ["default"]
  context = "tests"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/tests - the tests image for Lagoon"
  }
  tags = ["${IMAGE_REPO}/tests:${TAG}"]
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
  tags = ["${IMAGE_REPO}/webhook-handler:${TAG}"]
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
  tags = ["${IMAGE_REPO}/webhooks2tasks:${TAG}"]
}

target "workflows" {
  inherits = ["default"]
  context = "services/workflows"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/workflows - the workflows service for Lagoon"
  }
  tags = ["${IMAGE_REPO}/workflows:${TAG}"]
}

target "task-activestandby" {
  inherits = ["default"]
  context = "taskimages/activestandby"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/task-activestandby - the active/standby task image for Lagoon"
  }
  tags = ["${IMAGE_REPO}/task-activestandby:${TAG}"]
}

target "local-api-data-watcher-pusher" {
  inherits = ["default"]
  context = "local-dev/api-data-watcher-pusher"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/local-api-data-watcher-pusher - the local-dev data pusher image for Lagoon"
  }
  tags = ["${IMAGE_REPO}/local-api-data-watcher-pusher:${TAG}"]
}

target "local-git" {
  inherits = ["default"]
  context = "local-dev/git"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/local-git - the local-dev Git repository image for Lagoon"
  }
  tags = ["${IMAGE_REPO}/local-git:${TAG}"]
}
