# API Consolidation Refactoring Playbook

A repeatable set of prompts to consolidate the Lagoon monorepo JavaScript services into a standalone API service. Each prompt builds on the previous; prompts 1–4 can be reordered if the structure differs, but 5→6→7→8 must be sequential.

---

## Prompt 1 — Remove auth-server from the yarn workspace

```
Remove the auth-server service from the yarn workspace in the monorepo root package.json.
Convert it to a fully standalone pnpm service with its own package.json, pnpm-lock.yaml,
tsconfig.json, and ESLint v9 flat config (eslint.config.mjs). Fix any TypeScript errors
that arise. Do not change its Dockerfile or functionality.
```

---

## Prompt 2 — Eliminate the yarn-workspace-builder stage

```
The yarn-workspace-builder Docker stage (yarn-workspace-builder/Dockerfile) currently
installs workspace dependencies for the API. Inline its functionality directly into the
services/api/Dockerfile as a multi-stage build, then remove the yarn-workspace-builder
directory. Update docker-bake.hcl and the Makefile accordingly.
```

---

## Prompt 3 — Consolidate node-packages/commons into services/api

```
Move the node-packages/commons package into services/api/commons. Update the root
package.json workspaces array, all tsconfig.json extends/references, all jest configs,
all eslint configs, and all relative path references throughout the monorepo.
Delete the node-packages/ directory entirely.
```

---

## Prompt 4 — Remove root-level JS/TS infrastructure files

```
Delete the root tsconfig.json and root jest.config.js. Confirm nothing extends or imports
them. Merge any relevant jest project configuration into services/api/jest.config.js.
```

---

## Prompt 5 — Merge commons inline into services/api/src

```
Move all source files from services/api/commons/src/ into services/api/src/commons/.
Update services/api/tsconfig.json to add a paths alias mapping @lagoon/commons to
./src/commons. Update services/api/jest.config.js with a moduleNameMapper for the same.
Merge all commons package.json dependencies into services/api/package.json.
Change the build script from "tsc --build" to "tsc". Simplify the Dockerfile to remove
the separate commons build step. Delete services/api/commons/.
Update root package.json workspaces to only ["services/api"].
```

---

## Prompt 6 — Replace all @lagoon/commons imports with relative paths

```
Rewrite every file under services/api/src/ that imports from @lagoon/commons to use
correct relative paths instead (e.g. @lagoon/commons/util/config →
../../commons/util/config). The correct relative path depends on each file's depth
relative to src/commons/. After rewriting, remove the tsconfig paths/baseUrl entries
and the jest moduleNameMapper for @lagoon/commons — they are no longer needed.
Do not use module-alias or any other runtime alias package.
```

---

## Prompt 7 — Remove yarn workspaces entirely; make services/api fully standalone

```
Remove yarn workspaces from the monorepo entirely and make services/api a fully
standalone Node.js service:

1. Copy .env.defaults into services/api/.env.defaults and delete the root copy.
2. Move yarn.lock into services/api/yarn.lock.
3. Delete root package.json and root node_modules/.
4. Rewrite services/api/Dockerfile to be self-contained:
   - Build context is services/api/
   - WORKDIR /app
   - COPY package.json yarn.lock ./
   - Stage 1: yarn install --frozen-lockfile
   - Stage 2: copy node_modules, copy source, yarn build
5. Create services/api/.dockerignore (node_modules, dist, .git, *.log).
6. Update docker-bake.hcl: api target context = "services/api", dockerfile = "Dockerfile".
7. Update docker-compose.yaml and docker-compose.local-dev.yaml: all volume mounts and
   knex --cwd paths from /app/services/api/... → /app/...
8. Update local-dev/kubectl-patches/api.yaml mountPaths from /app/services/api → /app.
9. Update .vscode/launch.json and services/api/.vscode/launch.json remoteRoot to /app.
10. Update .github/workflows/test-db-migrations.yml knex --cwd paths.
11. Update all affected docs (EN and JA versions).
12. Run yarn install from services/api/ to verify.
```

---

## Prompt 8 — Add backwards-compatibility symlink for external services

```
Some external services still reference /app/services/api/... paths inside the API
container. Add a RUN step to services/api/Dockerfile after yarn build that creates
a symlink: ln -s /app /app/services/api
This makes /app/services/api/{database,src,dist} resolve correctly without changing
the external service.
```

---

## Prompt 9 — Migrate services/api from yarn to pnpm

```
Migrate the services/api service from yarn to pnpm:

1. If @types/ramda is referenced as a git package (e.g. "github:types/npm-ramda#dist"),
   replace it with the latest npm version ("^0.31.x or latest") in package.json.
   Also upgrade ramda to the latest version to match. The old git package required
   yarn to run its own build scripts, which is incompatible with pnpm.

2. Run: pnpm install --no-frozen-lockfile
   This generates pnpm-lock.yaml.

3. Create services/api/.npmrc with:
     node-linker=hoisted
   This makes pnpm use a flat node_modules layout matching yarn behaviour.

4. Run pnpm install again to regenerate the lockfile with the .npmrc setting.

5. Delete yarn.lock.

6. Add to services/api/package.json a "packageManager" field:
     "packageManager": "pnpm@<version>"
   and a "pnpm" config block allowlisting native build dependencies:
     "pnpm": {
       "onlyBuiltDependencies": [
         "@newrelic/fn-inspect", "@newrelic/native-metrics",
         "@types/ramda", "aws-sdk", "core-js",
         "protobufjs", "@apollo/protobufjs"
       ]
     }

7. Update all yarn run → pnpm run references in package.json scripts.

8. Update services/api/Dockerfile:
   - COPY package.json pnpm-lock.yaml ./
   - RUN corepack enable && pnpm install --frozen-lockfile
   - RUN corepack enable && pnpm build

9. Update .dockerignore: add yarn.lock to the ignore list.

10. Update Makefile: replace yarn commands with pnpm equivalents in
    local-dev-yarn and k3d/local-dev-patch targets.

11. Fix any TypeScript errors caused by ramda type version upgrade.
    Common patterns after upgrading from old npm-ramda git package:
    - R.pathEq(path, val) → R.pathEq(val, path)  [API changed in Ramda 0.28]
    - R.prop('key', obj) where 'key' is not in type → cast key: 'key' as any
    - R.last() returns T | undefined → explicit return type or cast as string
    - R.descend(R.prop('key')) → R.descend((r: any) => r.key)
    - R.over(R.lensProp('key'), fn) → (obj: any) => ({...obj, key: fn(obj.key)})
    - R.pluck('name')(rows) → R.pluck('name')(rows) as string[]
    - R.without(str) where array expected → R.without([str])
    - R.length(nids) where nids is Record → R.length(nids as any[])

12. Verify clean build: pnpm build should exit 0 with no errors.
```
