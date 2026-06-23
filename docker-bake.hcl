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

variable "LAGOON_SYNC_GIT_BRANCH" {
  default = "main"
}

variable "UPSTREAM_REPO" {
  default = "uselagoon"
}

variable "DATABASE_DOCKERFILE" {
  default = "Dockerfile"
}

variable "DATABASE_VENDOR" {
  default = "mariadb"
}

variable "UPSTREAM_TAG" {
  default = "latest"
}

variable "PLATFORMS" {
  // use PLATFORMS=linux/amd64,linux/arm64 to override default single architecture on the cli
  default = "linux/amd64"
}

variable "CACHE_TAG" {
  default = ""
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
    DATABASE_VENDOR = "${DATABASE_VENDOR}"
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
    "task-projectclone",
    "tests",
    "webhook-handler"
  ]
}

group "go-services" {
  targets = [
    "actions-handler",
    "backup-handler",
    "api-sidecar-handler",
    "logs2notifications",
    "task-activestandby",
    "task-projectclone",
    "webhook-handler"
  ]
}

group "js-services" {
  targets = [
    "api",
    "auth-server",
  ]
}

group "other" {
  targets = [
    "api-db",
    "api-redis",
    "broker",
    "keycloak-db",
    "keycloak",
    "ssh",
    "local-api-data-watcher-pusher",
    "local-git",
    "tests",
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
    "task-projectclone",
    "tests",
    "webhook-handler"
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
  cache-from = CACHE_TAG != "" ? [
    { type = "registry", ref = "${CACHE_TAG}-linux-amd64-api" },
    { type = "registry", ref = "${CACHE_TAG}-linux-arm64-api" }
  ] : []
  cache-to = CACHE_TAG != "" && PLATFORMS != "linux/amd64,linux/arm64" ? [
    { type = "registry", ref = "${CACHE_TAG}-${replace(PLATFORMS, "/", "-")}-api", mode = "max" }
  ] : []
}

target "api-db" {
  inherits = ["default"]
  context = "services/api-db"
  dockerfile = "${DATABASE_DOCKERFILE}"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/api-db - the MariaDB database service for Lagoon API"
  }
  tags = ["${IMAGE_REPO}/api-db:${TAG}"]
  cache-from = CACHE_TAG != "" ? [
    { type = "registry", ref = "${CACHE_TAG}-linux-amd64-api-db" },
    { type = "registry", ref = "${CACHE_TAG}-linux-arm64-api-db" }
  ] : []
  cache-to = CACHE_TAG != "" && PLATFORMS != "linux/amd64,linux/arm64" ? [
    { type = "registry", ref = "${CACHE_TAG}-${replace(PLATFORMS, "/", "-")}-api-db", mode = "max" }
  ] : []
}

target "api-redis" {
  inherits = ["default"]
  context = "services/api-redis"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/api-redis - the Redis service for Lagoon API"
  }
  tags = ["${IMAGE_REPO}/api-redis:${TAG}"]
  cache-from = CACHE_TAG != "" ? [
    { type = "registry", ref = "${CACHE_TAG}-linux-amd64-api-redis" },
    { type = "registry", ref = "${CACHE_TAG}-linux-arm64-api-redis" }
  ] : []
  cache-to = CACHE_TAG != "" && PLATFORMS != "linux/amd64,linux/arm64" ? [
    { type = "registry", ref = "${CACHE_TAG}-${replace(PLATFORMS, "/", "-")}-api-redis", mode = "max" }
  ] : []
}

target "actions-handler" {
  inherits = ["default"]
  context = "services/actions-handler"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/actions-handler - the actions-handler service for Lagoon"
  }
  tags = ["${IMAGE_REPO}/actions-handler:${TAG}"]
  cache-from = CACHE_TAG != "" ? [
    { type = "registry", ref = "${CACHE_TAG}-linux-amd64-actions-handler" },
    { type = "registry", ref = "${CACHE_TAG}-linux-arm64-actions-handler" }
  ] : []
  cache-to = CACHE_TAG != "" && PLATFORMS != "linux/amd64,linux/arm64" ? [
    { type = "registry", ref = "${CACHE_TAG}-${replace(PLATFORMS, "/", "-")}-actions-handler", mode = "max" }
  ] : []
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
  cache-from = CACHE_TAG != "" ? [
    { type = "registry", ref = "${CACHE_TAG}-linux-amd64-auth-server" },
    { type = "registry", ref = "${CACHE_TAG}-linux-arm64-auth-server" }
  ] : []
  cache-to = CACHE_TAG != "" && PLATFORMS != "linux/amd64,linux/arm64" ? [
    { type = "registry", ref = "${CACHE_TAG}-${replace(PLATFORMS, "/", "-")}-auth-server", mode = "max" }
  ] : []
}

target "backup-handler" {
  inherits = ["default"]
  context = "services/backup-handler"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/backup-handler - the backup-handler service for Lagoon"
  }
  tags = ["${IMAGE_REPO}/backup-handler:${TAG}"]
  cache-from = CACHE_TAG != "" ? [
    { type = "registry", ref = "${CACHE_TAG}-linux-amd64-backup-handler" },
    { type = "registry", ref = "${CACHE_TAG}-linux-arm64-backup-handler" }
  ] : []
  cache-to = CACHE_TAG != "" && PLATFORMS != "linux/amd64,linux/arm64" ? [
    { type = "registry", ref = "${CACHE_TAG}-${replace(PLATFORMS, "/", "-")}-backup-handler", mode = "max" }
  ] : []
}

target "broker" {
  inherits = ["default"]
  context = "services/broker"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/broker - the RabbitMQ broker service for Lagoon"
  }
  tags = ["${IMAGE_REPO}/broker:${TAG}"]
  cache-from = CACHE_TAG != "" ? [
    { type = "registry", ref = "${CACHE_TAG}-linux-amd64-broker" },
    { type = "registry", ref = "${CACHE_TAG}-linux-arm64-broker" }
  ] : []
  cache-to = CACHE_TAG != "" && PLATFORMS != "linux/amd64,linux/arm64" ? [
    { type = "registry", ref = "${CACHE_TAG}-${replace(PLATFORMS, "/", "-")}-broker", mode = "max" }
  ] : []
}

target "api-sidecar-handler" {
  inherits = ["default"]
  context = ""
  dockerfile = "services/api-sidecar-handler/Dockerfile"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/api-sidecar-handler - the api-sidecar-handler service for Lagoon"
  }
  tags = ["${IMAGE_REPO}/api-sidecar-handler:${TAG}"]
  cache-from = CACHE_TAG != "" ? [
    { type = "registry", ref = "${CACHE_TAG}-linux-amd64-api-sidecar-handler" },
    { type = "registry", ref = "${CACHE_TAG}-linux-arm64-api-sidecar-handler" }
  ] : []
  cache-to = CACHE_TAG != "" && PLATFORMS != "linux/amd64,linux/arm64" ? [
    { type = "registry", ref = "${CACHE_TAG}-${replace(PLATFORMS, "/", "-")}-api-sidecar-handler", mode = "max" }
  ] : []
}

target "keycloak" {
  inherits = ["default"]
  context = "services/keycloak"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/keycloak - the Keycloak service for Lagoon"
  }
  tags = ["${IMAGE_REPO}/keycloak:${TAG}"]
  cache-from = CACHE_TAG != "" ? [
    { type = "registry", ref = "${CACHE_TAG}-linux-amd64-keycloak" },
    { type = "registry", ref = "${CACHE_TAG}-linux-arm64-keycloak" }
  ] : []
  cache-to = CACHE_TAG != "" && PLATFORMS != "linux/amd64,linux/arm64" ? [
    { type = "registry", ref = "${CACHE_TAG}-${replace(PLATFORMS, "/", "-")}-keycloak", mode = "max" }
  ] : []
}

target "keycloak-db" {
  inherits = ["default"]
  context = "services/keycloak-db"
  dockerfile = "${DATABASE_DOCKERFILE}"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/keycloak-db - the MariaDB database service for Lagoon Keycloak"
  }
  tags = ["${IMAGE_REPO}/keycloak-db:${TAG}"]
  cache-from = CACHE_TAG != "" ? [
    { type = "registry", ref = "${CACHE_TAG}-linux-amd64-keycloak-db" },
    { type = "registry", ref = "${CACHE_TAG}-linux-arm64-keycloak-db" }
  ] : []
  cache-to = CACHE_TAG != "" && PLATFORMS != "linux/amd64,linux/arm64" ? [
    { type = "registry", ref = "${CACHE_TAG}-${replace(PLATFORMS, "/", "-")}-keycloak-db", mode = "max" }
  ] : []
}

target "logs2notifications" {
  inherits = ["default"]
  context = "services/logs2notifications"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/logs2notifications - the logs2notifications service for Lagoon"
  }
  tags = ["${IMAGE_REPO}/logs2notifications:${TAG}"]
  cache-from = CACHE_TAG != "" ? [
    { type = "registry", ref = "${CACHE_TAG}-linux-amd64-logs2notifications" },
    { type = "registry", ref = "${CACHE_TAG}-linux-arm64-logs2notifications" }
  ] : []
  cache-to = CACHE_TAG != "" && PLATFORMS != "linux/amd64,linux/arm64" ? [
    { type = "registry", ref = "${CACHE_TAG}-${replace(PLATFORMS, "/", "-")}-logs2notifications", mode = "max" }
  ] : []
}

target "ssh" {
  inherits = ["default"]
  context = "."
  dockerfile = "services/ssh/Dockerfile"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/ssh - the ssh service for Lagoon"
  }
  tags = ["${IMAGE_REPO}/ssh:${TAG}"]
  cache-from = CACHE_TAG != "" ? [
    { type = "registry", ref = "${CACHE_TAG}-linux-amd64-ssh" },
    { type = "registry", ref = "${CACHE_TAG}-linux-arm64-ssh" }
  ] : []
  cache-to = CACHE_TAG != "" && PLATFORMS != "linux/amd64,linux/arm64" ? [
    { type = "registry", ref = "${CACHE_TAG}-${replace(PLATFORMS, "/", "-")}-ssh", mode = "max" }
  ] : []
}

target "tests" {
  inherits = ["default"]
  context = "tests"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/tests - the tests image for Lagoon"
  }
  tags = ["${IMAGE_REPO}/tests:${TAG}"]
  cache-from = CACHE_TAG != "" ? [
    { type = "registry", ref = "${CACHE_TAG}-linux-amd64-tests" },
    { type = "registry", ref = "${CACHE_TAG}-linux-arm64-tests" }
  ] : []
  cache-to = CACHE_TAG != "" && PLATFORMS != "linux/amd64,linux/arm64" ? [
    { type = "registry", ref = "${CACHE_TAG}-${replace(PLATFORMS, "/", "-")}-tests", mode = "max" }
  ] : []
}

target "webhook-handler" {
  inherits = ["default"]
  context = ""
  dockerfile = "services/webhook-handler/Dockerfile"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/webhook-handler - the webhook-handler service for Lagoon"
  }
  tags = ["${IMAGE_REPO}/webhook-handler:${TAG}"]
  cache-from = CACHE_TAG != "" ? [
    { type = "registry", ref = "${CACHE_TAG}-linux-amd64-webhook-handler" },
    { type = "registry", ref = "${CACHE_TAG}-linux-arm64-webhook-handler" }
  ] : []
  cache-to = CACHE_TAG != "" && PLATFORMS != "linux/amd64,linux/arm64" ? [
    { type = "registry", ref = "${CACHE_TAG}-${replace(PLATFORMS, "/", "-")}-webhook-handler", mode = "max" }
  ] : []
}

target "task-activestandby" {
  inherits = ["default"]
  context = "taskimages/activestandby"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/task-activestandby - the active/standby task image for Lagoon"
  }
  tags = ["${IMAGE_REPO}/task-activestandby:${TAG}"]
  cache-from = CACHE_TAG != "" ? [
    { type = "registry", ref = "${CACHE_TAG}-linux-amd64-task-activestandby" },
    { type = "registry", ref = "${CACHE_TAG}-linux-arm64-task-activestandby" }
  ] : []
  cache-to = CACHE_TAG != "" && PLATFORMS != "linux/amd64,linux/arm64" ? [
    { type = "registry", ref = "${CACHE_TAG}-${replace(PLATFORMS, "/", "-")}-task-activestandby", mode = "max" }
  ] : []
}

target "task-projectclone" {
  inherits = ["default"]
  context = "taskimages/projectclone"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/task-projectclone - the projectclone task image for Lagoon"
  }
  tags = ["${IMAGE_REPO}/task-projectclone:${TAG}"]
  args = {
    LAGOON_SYNC_GIT_BRANCH = "${LAGOON_SYNC_GIT_BRANCH}"
  }
  cache-from = CACHE_TAG != "" ? [
    { type = "registry", ref = "${CACHE_TAG}-linux-amd64-task-projectclone" },
    { type = "registry", ref = "${CACHE_TAG}-linux-arm64-task-projectclone" }
  ] : []
  cache-to = CACHE_TAG != "" && PLATFORMS != "linux/amd64,linux/arm64" ? [
    { type = "registry", ref = "${CACHE_TAG}-${replace(PLATFORMS, "/", "-")}-task-projectclone", mode = "max" }
  ] : []
}

target "local-api-data-watcher-pusher" {
  inherits = ["default"]
  context = "local-dev/api-data-watcher-pusher"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/local-api-data-watcher-pusher - the local-dev data pusher image for Lagoon"
  }
  tags = ["${IMAGE_REPO}/local-api-data-watcher-pusher:${TAG}"]
  cache-from = CACHE_TAG != "" ? [
    { type = "registry", ref = "${CACHE_TAG}-linux-amd64-local-api-data-watcher-pusher" },
    { type = "registry", ref = "${CACHE_TAG}-linux-arm64-local-api-data-watcher-pusher" }
  ] : []
  cache-to = CACHE_TAG != "" && PLATFORMS != "linux/amd64,linux/arm64" ? [
    { type = "registry", ref = "${CACHE_TAG}-${replace(PLATFORMS, "/", "-")}-local-api-data-watcher-pusher", mode = "max" }
  ] : []
}

target "local-git" {
  inherits = ["default"]
  context = "local-dev/git"
  labels = {
    "org.opencontainers.image.title": "lagoon-core/local-git - the local-dev Git repository image for Lagoon"
  }
  tags = ["${IMAGE_REPO}/local-git:${TAG}"]
  cache-from = CACHE_TAG != "" ? [
    { type = "registry", ref = "${CACHE_TAG}-linux-amd64-local-git" },
    { type = "registry", ref = "${CACHE_TAG}-linux-arm64-local-git" }
  ] : []
  cache-to = CACHE_TAG != "" && PLATFORMS != "linux/amd64,linux/arm64" ? [
    { type = "registry", ref = "${CACHE_TAG}-${replace(PLATFORMS, "/", "-")}-local-git", mode = "max" }
  ] : []
}
