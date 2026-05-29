# Yarn-to-pnpm Standalone Services Migration Plan

> Reverse-engineered from the `testing/yarn-to-pnpm` branch (forked from `webhook-handler-go`).
> Each phase below corresponds to a logical group of commits that were typically landed as a single unit (sometimes with follow-up fixups).

---

## Background

The Lagoon monorepo historically used **Yarn Workspaces** to link Node.js services
(`api`, `auth-server`) and a shared `node-packages/commons` library together. A root
`package.json`, root `yarn.lock`, root `tsconfig.json`, and a `yarn-workspace-builder`
Docker stage formed the glue.

Go services (`actions-handler`, `backup-handler`, `logs2notifications`,
`webhook-handler`, `api-sidecar-handler`) already operate as standalone modules
using the root `go.mod`.

### Prerequisites (already complete)

The following work was completed on the `webhook-handler-go` branch prior to this
migration and is assumed as a starting point:

- **webhook-handler** rewritten from Node.js/TypeScript to Go
- **webhooks2tasks** eliminated — responsibilities absorbed into the Go
  webhook-handler and api-sidecar-handler
- **backup-handler** refactored to talk to the API directly instead of the broker
- Old Node.js webhook-handler and webhooks2tasks removed from the Yarn workspace

This means the only remaining Yarn workspace members are **`api`** and
**`auth-server`**, plus the shared **`node-packages/commons`** library.

---

## Goal

Make every Node.js service fully standalone — each service owns its own
dependencies, lockfile, and build — eliminating the shared Yarn workspace
infrastructure entirely, and migrating from Yarn to pnpm.

---

## Phase 1: Auth-server standalone + pnpm migration

**Commits:** `defd98e7b`..`141f6adde` (3 commits)
**Scope:** 12 files changed, +4,046 / −2,400 lines

### What was done

1. **Disconnected `auth-server`** from the Yarn workspace — gave it its own
   `package.json` dependencies (previously relied on hoisted workspace deps).
2. **Migrated `auth-server` from Yarn to pnpm** — added `pnpm-lock.yaml`,
   removed `yarn.lock`.
3. **Detached ESLint config** — `auth-server` got its own ESLint setup instead
   of referencing the shared `eslint-config-lagoon-node` package from
   `node-packages/`.
4. Updated `auth-server/Dockerfile` to use standalone pnpm install instead of
   the `yarn-workspace-builder` multi-stage pattern.

### Key decisions

- `auth-server` is the simpler of the two remaining Node services, so it was
  migrated first as a proof of concept.
- pnpm was chosen over Yarn for standalone services (faster, stricter dependency
  resolution, better monorepo-to-standalone story).

---

## Phase 2: Remove yarn-workspace-builder — standalone API build

**Commit:** `fc426616f`
**Scope:** 4 files changed, +24 / −47 lines

### What was done

1. **Deleted `yarn-workspace-builder/Dockerfile`** — the Docker multi-stage builder
   image that previously installed all Yarn workspace dependencies for every Node
   service.
2. **Updated `services/api/Dockerfile`** to install its own dependencies directly
   instead of copying from the `yarn-workspace-builder` stage.
3. **Cleaned up `Makefile` and `docker-bake.hcl`** — removed references to the
   yarn-workspace-builder target.

### Why this is separate

The build change can be landed and tested in isolation. After this commit the API
still uses Yarn and still references `node-packages/commons` — but its Docker build
no longer depends on the shared builder image.

---

## Phase 3: Consolidate commons and remove Yarn workspace root

**Commits:** `d389edd91`..`831981965` (4 commits + fixups)
**Scope:** ~95 files changed

### What was done

1. **Consolidated `node-packages/commons` into `services/api/`** — all shared
   TypeScript utilities, types, JWT helpers, logging, and API client code were
   moved into the API service's source tree (under `src/commons/` or directly
   into relevant modules).
2. **Updated all import paths** in the API codebase from `@lagoon/commons/...`
   to local relative imports.
3. **Removed `node-packages/` directory entirely** — no more shared packages.
4. **Removed `node-packages/eslint-config-lagoon-node/`** — each service now
   owns its own lint configuration.
5. **Deleted root `package.json`** — no more Yarn workspace root.
6. **Moved root `yarn.lock` into `services/api/`** — the API now owns its own
   lockfile.
7. **Deleted root `tsconfig.json`** — each service has its own TypeScript config.
8. Fixed K3d config and Makefile UI override issues from the restructure.

### Key decisions

- Commons code was merged *into the API* rather than published as an npm package,
  because the API was the only remaining consumer after webhook-handler and
  webhooks2tasks were rewritten in Go.
- This eliminated the need for workspace linking entirely.

---

## Phase 4: API — Yarn to pnpm migration

**Commits:** `2a95edead`..`e526a9a8b` (7 commits)
**Scope:** 183 files changed, +21,251 / −19,968 lines

### What was done

1. **Updated API packages** — refreshed all dependencies to current versions.
2. **Migrated API from Yarn to pnpm** — added `pnpm-lock.yaml`, removed
   `yarn.lock`.
3. Fixed missing packages surfaced by pnpm's stricter dependency resolution
   (`graphql-tag`, Ramda imports, etc.).
4. **TypeScript fixups** — resolved type errors from stricter package versions.
5. **Fixed Jest configuration** — adapted test runner config for standalone pnpm
   setup, added module mocks for `mariadb`, `node-fetch`, and `redis` so the
   existing test suites run without external dependencies.

### Key decisions

- The bulk of the line changes are lockfile churn (`yarn.lock` deleted,
  `pnpm-lock.yaml` added).
- pnpm's strict mode caught several implicit/phantom dependencies that Yarn's
  hoisting had silently resolved.

---

## Phase 5: API test coverage expansion

**Commit:** `e526a9a8b` (initial), ongoing
**Reference:** `services/api/TEST_COVERAGE_PLAN.md`

### Current state

8 test suites, 22 tests, 14 snapshots — all passing. Coverage is concentrated in
SQL query builders and one permission helper. Utility code, business-logic helpers,
and the auth layer have no tests.

### What was done

1. **Fixed Jest for pnpm** — added `jest.config.js` with `moduleNameMapper` and
   manual mocks (`__mocks__/mariadb.js`, `__mocks__/node-fetch.js`,
   `__mocks__/redis.js`) so tests run without live infrastructure.
2. **Added `sshKey/helpers.ts`** — extracted `validateSshKey` into a testable
   pure function.
3. **Updated snapshots** — regenerated environment and notification snapshots to
   match the post-migration import paths.
4. **Created `TEST_COVERAGE_PLAN.md`** — a tiered plan for expanding API test
   coverage (see below).

### Planned test tiers

| Tier | Target | Effort | Description |
|------|--------|--------|-------------|
| 1 | Pure utilities | Low | `func.ts`, `snakeCase.ts`, `pickNonNil.ts`, `convertDate.ts`, `advancedTaskDefinitionArgument.ts` — no DB, no mocks |
| 2 | SQL query builders | Low | Snapshot tests for all `sql.ts` files (`task`, `deployment`, `routes`, `backup`, `organization`, `problem`, etc.) — same pattern as existing tests |
| 3 | Business logic + regressions | Medium | `userActivityLogger` (regression), `extractWsToken` (auth fallback paths), `filterAdminTasks`, `groupByProblemIdentifier`, environment validators |
| 4 | Model / integration layer | High | `user.ts` model, `group.ts` model, `authMiddleware.ts` — requires mocked `sqlClientPool` and `keycloak-admin` |

### Coverage targets

| Category | Current | After Tier 1+2 | After Tier 3+4 |
|----------|---------|----------------|----------------|
| Utility functions | ~0% | ~90% | ~90% |
| SQL builders | ~20% | ~85% | ~85% |
| Business logic helpers | ~5% | ~30% | ~70% |
| Auth / models | ~5% | ~10% | ~50% |
| Resolvers | 0% | 0% | 0% (covered by E2E) |

### Not unit tested (by design)

Resolver files, server bootstrap, HTTP route handlers, and third-party client
wrappers are better covered by the existing k3d integration/E2E test suite.

---

## Final State

### Before (starting point — post `webhook-handler-go`)

```
lagoon/
├── package.json              # Yarn workspace root
├── yarn.lock                 # Shared lockfile
├── tsconfig.json             # Shared TypeScript config
├── yarn-workspace-builder/   # Docker builder for all Node services
├── node-packages/
│   ├── commons/              # Shared TS library (JWT, logging, API client, utils)
│   └── eslint-config-lagoon-node/
└── services/
    ├── api/                  # Node/TS — Yarn workspace member
    ├── auth-server/          # Node/TS — Yarn workspace member
    └── ...                   # Go services already standalone
```

### After (on `testing/yarn-to-pnpm`)

```
lagoon/
└── services/
    ├── api/                  # Node/TS — standalone, pnpm, owns former commons code
    │   ├── package.json
    │   ├── pnpm-lock.yaml
    │   ├── tsconfig.json
    │   └── src/commons/      # Absorbed from node-packages/commons
    ├── auth-server/          # Node/TS — standalone, pnpm
    │   ├── package.json
    │   └── pnpm-lock.yaml
    └── ...                   # Go services unchanged
```

### What was removed

| Artifact | Reason |
|----------|--------|
| `package.json` (root) | No more Yarn workspaces |
| `yarn.lock` (root) | Each service has its own lockfile |
| `tsconfig.json` (root) | Each service has its own TS config |
| `yarn-workspace-builder/` | No shared Docker build stage needed |
| `node-packages/commons/` | Merged into `services/api/` |
| `node-packages/eslint-config-lagoon-node/` | Each service owns its lint config |

---

## Remaining / Future Work

- [ ] **CI/CD pipeline updates** — Jenkinsfile and docker-bake.hcl may need
      adjustments for the new standalone build model (no more yarn-workspace-builder
      stage).
- [ ] **Helm chart alignment** — charts need to reflect any changed image names or
      build targets.
- [ ] **Integration test updates** — ensure the Ansible-based test suite works with
      the standalone service builds.
