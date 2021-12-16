# Updating

1. Follow normal Helm Chart update procedures.
2. Tell Helm to download newest charts:

    `helm repo update`
3. Check with `helm diff` for changes: (https://github.com/databus23/helm-diff if not installed).
   1. `helm diff upgrade --install --create-namespace --namespace lagoon-core -f values.yaml lagoon-core lagoon/lagoon-core`
4. Upgrade:
   1. `helm upgrade --install --create-namespace --namespace lagoon-core -f values.yaml lagoon-core lagoon/lagoon-core`
5. If upgrading Lagoon Core:
   1. `kubectl exec -it lagoon-core-api-db-0 sh`
   2. Run inside shell:
      1. `/rerun_initdb.sh`
6. Check [https://github.com/uselagoon/lagoon/releases](https://github.com/uselagoon/lagoon/releases) for additional upgrades.
