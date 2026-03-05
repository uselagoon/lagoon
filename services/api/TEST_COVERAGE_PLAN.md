# Test Coverage Plan — `services/api`

## Current State

8 test suites, 22 tests, 14 snapshots. All passing.

| File | What it covers |
|------|---------------|
| `src/commons/__tests__/jwt.test.ts` | `createJWTWithoutUserId` — token creation + verification |
| `src/resources/environment/environment.test.js` | `Sql.updateEnvironment`, `Sql.selectEnvironment` |
| `src/resources/notification/notification.test.js` | 4 `Sql.*` query builders |
| `src/resources/openshift/openshift.test.js` | `Sql.*` query builders |
| `src/resources/project/project.test.js` | `Sql.*` query builders |
| `src/resources/sshKey/sshKey.test.js` | `Sql.*` query builders + `validateSshKey` |
| `src/resources/task/advancedtasktoolbox.test.ts` | `canUserSeeTaskDefinition` + permission logic |
| `src/resources/task/models/taskRegistration.test.ts` | `TaskRegistration` model construction |

Coverage is concentrated in SQL builders and one permission helper. Large swaths of utility code, business-logic helpers, and the auth layer have no tests.

---

## Tier 1 — Pure Utilities (no DB, no network, easy wins)

These are pure/near-pure functions with no external dependencies. Tests can be written in an afternoon and will never break due to infrastructure changes.

### 1.1 `src/util/func.ts` + `src/commons/util/func.ts`

**Why**: Re-exported across the whole codebase. Bugs here are silent and widespread.

New file: `src/util/__tests__/func.test.ts`

| Function | Cases to cover |
|----------|---------------|
| `toNumber` | string int, string float, already-a-number, `NaN` input |
| `jsonMerge` | merges on prop, deduplicates, keeps b's version on conflict |
| `arrayDiff` | basic diff, empty arrays, no overlap, full overlap |
| `encodeBase64` / `decodeBase64` | round-trip identity, unicode |
| `encodeJSONBase64` / `decodeJSONBase64` | round-trip identity, nested objects |
| `getErrorMessage` | `Error` instance, plain string, unknown type |
| `isDNS1123Subdomain` | valid subdomain, too long, invalid chars, empty string |
| `isNotNil` / `isNotEmpty` | truthy/falsy cases |

### 1.2 `src/util/snakeCase.ts`

**Why**: Used by the knex identifier mapping. A subtle bug here corrupts all column names.

New file: `src/util/__tests__/snakeCase.test.ts`

| Case | Example |
|------|---------|
| Lowercase pass-through | `foo` → `foo` |
| Simple camelCase | `fooBar` → `foo_bar` |
| Consecutive uppercase | `fooBAR` → `foo_bar` |
| Already snake | `foo_bar` → `foo_bar` |
| Single char | `A` → `a` |
| `upperCase: true` flag | `fooBar` → `FOO_BAR` |

### 1.3 `src/util/pickNonNil.ts`

New file: `src/util/__tests__/pickNonNil.test.ts`

| Case | Example |
|------|---------|
| Picks requested keys | `{ a: 1, b: 2 }` pick `['a']` → `{ a: 1 }` |
| Omits null values | `{ a: null, b: 2 }` → `{ b: 2 }` |
| Omits undefined values | `{ a: undefined, b: 2 }` → `{ b: 2 }` |
| Keeps falsy non-nil | `{ a: 0, b: false }` → both kept |
| Curried usage | `pickNonNil(['x'])({ x: 1, y: null })` |

### 1.4 `src/util/convertDateToMYSQLDateTimeFormat.ts`

New file: `src/util/__tests__/convertDate.test.ts`

| Case |
|------|
| ISO string → `YYYY-MM-DD HH:mm:ss` |
| `convertDateToMYSQLDateFormat` → `YYYY-MM-DD` only |
| Invalid date string handling |

### 1.5 `src/resources/sshKey/helpers.ts` — `validateSshKey`

Already exercised via `sshKey.test.js`. Consider moving to a proper `.test.ts` with typed imports and adding:
- DSS key type
- Key with no trailing comment
- Whitespace-padded input

### 1.6 `src/resources/task/models/advancedTaskDefinitionArgument.ts`

New file: `src/resources/task/models/advancedTaskDefinitionArgument.test.ts`

| Class / Function | Cases |
|-----------------|-------|
| `StringArgument.validateInput` | any string returns `true` |
| `NumberArgument.validateInput` | `'42'` → true, `'3.14'` → true, `'abc'` → false, `''` → false |
| `ArgumentBase.validateInput` | always true |
| `advancedTaskDefinitionTypeFactory` | returns correct class for each type name, throws on unknown |
| `EnvironmentSourceArgument.validateInput` | uses mocked `query()` returning env names |

---

## Tier 2 — SQL Query Builders (snapshot tests)

These follow the identical pattern to the existing `*.test.js` files: call a `Sql.*` method, snapshot the resulting SQL string. No DB needed. No mocks needed. Ordered by size/value.

Each should live at `src/resources/<name>/<name>.test.ts`.

### 2.1 `src/resources/task/sql.ts` (335 lines) — highest priority

Key builders to snapshot:
- `selectTask`, `selectTaskByNameAndEnvironment`
- `insertTask` (all fields, partial fields)
- `updateTask` (patch semantics — only provided fields updated)
- `selectTasksByEnvironmentId` with/without status filter
- `deleteTask`
- Advanced task definition builders: `insertAdvancedTaskDefinition`, `selectAdvancedTaskDefinition`, `updateAdvancedTaskDefinition`

### 2.2 `src/resources/deployment/sql.ts` (212 lines)

Key builders:
- `selectDeployment`, `selectDeploymentByNameAndEnvironment`
- `insertDeployment` (all fields)
- `updateDeployment` (patch)
- `selectDeploymentsByEnvironmentId` — includes ordering, status filters, pagination args
- `deleteDeployment`

### 2.3 `src/resources/routes/sql.ts` (194 lines)

Key builders:
- `selectRoutesByEnvironmentId`
- `insertRoute`, `updateRoute`, `deleteRoute`
- Autogenerated route builders
- Route annotation builders

### 2.4 `src/resources/problem/sql.ts` (144 lines)

Key builders:
- `selectAllProblems` — the parameterised source/severity/envType filtering
- `insertProblem`, `deleteProblem`
- `selectProblemsForEnvironment`

### 2.5 `src/resources/organization/sql.ts` (130 lines)

Key builders:
- `selectOrganization`, `insertOrganization`, `updateOrganization`, `deleteOrganization`
- `selectOrganizationProjects`, `addProjectToOrganization`

### 2.6 `src/resources/backup/sql.ts` (129 lines)

Key builders:
- `selectBackup`, `insertBackup`
- `selectRestore`, `insertRestore`, `updateRestore`
- `deleteBackupsForEnvironment`

### 2.7 `src/resources/retentionpolicy/sql.ts` (112 lines)

Key builders:
- `selectRetentionPolicy`, `insertRetentionPolicy`, `updateRetentionPolicy`

### 2.8 `src/resources/env-variables/sql.ts` (94 lines)

Key builders:
- `selectEnvVariablesByProjectId`, `selectEnvVariablesByEnvironmentId`
- `insertEnvVariable` (project scope, environment scope)
- `deleteEnvVariable`

### 2.9 `src/resources/fact/sql.ts` (91 lines)

Key builders:
- `insertFact`, `deleteFact`, `selectFacts`
- `selectFactsByEnvironmentId` with name filter

### 2.10 `src/resources/group/sql.ts` (66 lines)

Key builders:
- `selectGroup`, `insertGroup`, `updateGroup`, `deleteGroup`

### 2.11 `src/resources/user/sql.ts` (62 lines)

Key builders:
- `selectUser`, `insertUser`, `updateUser`

### 2.12 `src/resources/deploytargetconfig/sql.ts` (61 lines)

Key builders:
- `selectDeployTargetConfig`, `insertDeployTargetConfig`, `updateDeployTargetConfig`

### 2.13 `src/resources/audit/sql.ts` (31 lines)

- `insertAuditLog`, `selectAuditLogs`

---

## Tier 3 — Business Logic with Mocked Dependencies

These functions contain real branching logic but require mocked DB or auth. Use `jest.fn()` for `sqlClientPool` and `hasPermission`.

### 3.1 `src/loggers/userActivityLogger.ts` — `parseAndCleanMeta` (regression tests)

**Why**: This function had a null-reference bug (fixed) and silently strips sensitive data from logs. A regression suite here prevents recurrence.

New file: `src/loggers/__tests__/userActivityLogger.test.ts`

| Case | Description |
|------|-------------|
| Keycloak user with `access_token` | Strips token content, keeps safe fields only |
| Legacy user (no `access_token`) | Keeps `username`, `email`, `role`, drops nothing unexpected |
| Null `headers` | Does not throw — returns meta without headers (`!= null` guard) |
| Null `user` | Returns meta with null user |
| Entirely `null` meta | Returns `undefined` / empty cleanly |
| `headers` with `user-agent` | Truncates long user-agent strings |
| Complex nested `payload` | Preserved as-is |

### 3.2 `src/util/auth.ts` — `extractWsToken`

**Why**: We added this function to fix WebSocket auth. It has a non-trivial set of fallback paths.

New file: `src/util/__tests__/auth.test.ts`

| Case |
|------|
| `connectionParams.authToken` present |
| `connectionParams.Authorization` with `Bearer ` prefix |
| `connectionParams.authorization` (lowercase) |
| `connectionParams.headers.Authorization` |
| `connectionParams.headers.authorization` |
| All null/undefined → returns `null` |
| Strips `Bearer ` prefix correctly |

### 3.3 `src/resources/task/filters.ts` — `filterAdminTasks`

New file: `src/resources/task/__tests__/filters.test.ts`

| Case |
|------|
| No admin tasks in list → all rows returned, permission never checked |
| Admin task present + user has `viewAll` → all rows returned |
| Admin task present + user denied `viewAll` → admin rows removed |
| Mix of admin and non-admin rows → only non-admin survive when denied |
| Empty row list → returns empty array |

### 3.4 `src/resources/problem/helpers.ts` — `groupByProblemIdentifier`

New file: `src/resources/problem/__tests__/helpers.test.ts`

| Case |
|------|
| Single problem → object with one key |
| Multiple problems, same identifier → grouped under one key |
| Multiple problems, different identifiers → separate keys |
| Empty array → empty object |

### 3.5 `src/resources/routes/helpers.ts` — constants + `isDNS1123Subdomain` usage

New file: `src/resources/routes/__tests__/helpers.test.ts`

| Case |
|------|
| `AnnotationLimit`, `PathRoutesLimit`, `AlternativeDomainsLimit` constants have expected values |
| `validateRouteAnnotation` (if present) — valid/invalid annotation formats |

### 3.6 `src/resources/environment/validators.ts`

New file: `src/resources/environment/__tests__/validators.test.ts`

Use `jest.fn()` + `moduleNameMapper` for `sqlClientPool`.

| Validator | Cases |
|-----------|-------|
| `environmentExists` | row found → no throw; row missing → throws Unauthorized |
| `environmentsHaveSameProject` | same project id → ok; different project ids → throws |
| `environmentHasService` | service present → ok; service missing → throws |

---

## Tier 4 — Integration / Model Layer

Higher effort but covers the most critical path: Keycloak + DB interactions.
These are the highest-value tests but require the most setup time. Recommended for a second pass.

### 4.1 `src/models/user.ts` (1,017 lines)

Mock both `sqlClientPool` (via `moduleNameMapper`) and `keycloak-admin` client. Focus on:
- `getUserById`, `getUserByUsername` — basic DB reads
- `addUser`, `updateUser` — DB writes + Keycloak calls
- `getUserRoles` — role aggregation logic

### 4.2 `src/models/group.ts` (1,137 lines)

Same approach. Focus on:
- `getGroupMembership` — the pagination loop
- `addUserToGroup`, `removeUserFromGroup`
- `getGroupsByProjectId`

### 4.3 `src/authMiddleware.ts`

Use `supertest` or plain `req`/`res` mocks:
- Valid JWT token → `req.user` set
- Expired token → 401
- Missing token → 401
- Bearer format vs `lagoon-token` format

---

## Not Worth Unit Testing

These are better covered by integration/E2E tests (the existing k3d test suite):

- All `resolvers.ts` files — too tightly coupled to the full GraphQL context object; mock cost exceeds benefit
- `src/server.ts` — server bootstrap, WebSocket/SSE setup
- `src/routes/*.ts` — thin HTTP handlers
- `src/clients/*.ts` — thin third-party client wrappers
- `src/mocks.js` / `src/typeDefs.js` — GraphQL schema definitions

---

## Execution Order

```
Phase 1 (Tier 1 + Tier 3 selected items) — ~1–2 days
  ✦ src/util/__tests__/func.test.ts
  ✦ src/util/__tests__/snakeCase.test.ts
  ✦ src/util/__tests__/pickNonNil.test.ts
  ✦ src/util/__tests__/convertDate.test.ts
  ✦ src/resources/task/models/advancedTaskDefinitionArgument.test.ts
  ✦ src/resources/task/__tests__/filters.test.ts
  ✦ src/loggers/__tests__/userActivityLogger.test.ts  (regression)
  ✦ src/util/__tests__/auth.test.ts  (extractWsToken regression)

Phase 2 (Tier 2 SQL builders) — ~1 day
  ✦ Start with task, deployment, routes (largest/most complex)
  ✦ Then backup, org, problem, retentionpolicy
  ✦ Then env-variables, fact, group, user, deploytargetconfig, audit

Phase 3 (Tier 3 remaining) — ~1 day
  ✦ validators, problem helpers, routes constants

Phase 4 (Tier 4 model layer) — ~2–3 days
  ✦ user model, group model, authMiddleware
```

## Coverage Target

| Category | Current | After Phase 1+2 | After Phase 3+4 |
|----------|---------|-----------------|-----------------|
| Utility functions | ~0% | ~90% | ~90% |
| SQL builders | ~20% | ~85% | ~85% |
| Business logic helpers | ~5% | ~30% | ~70% |
| Auth / models | ~5% | ~10% | ~50% |
| Resolvers | 0% | 0% | 0% (E2E) |
