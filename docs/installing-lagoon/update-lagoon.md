# Updating

1. Download newest charts using helm

    ```
    helm repo update
    ```

2. Check with `helm diff` for changes [https://github.com/databus23/helm-diff](https://github.com/databus23/helm-diff).

    ```
    helm diff upgrade --install --create-namespace --namespace lagoon-core \
        -f values.yaml lagoon-core lagoon/lagoon-core
    ```

3. Run the upgrade using helm

    ```
    helm upgrade --install --create-namespace --namespace lagoon-core \
        -f values.yaml lagoon-core lagoon/lagoon-core
    ```

4. If upgrading Lagoon Core, ensure you run the `rerun_initdb.sh` script to perform post upgrade migrations

    ```
    kubectl --namespace lagoon-core exec -it lagoon-core-api-db-0 -- \
        sh -c /rerun_initdb.sh
    ```

5. If upgrading Lagoon Core, and you have enabled groups/user syncing for OpenSearch, you may additionally need to run the `sync:opendistro-security` script to update the groups in OpenSearch. This command can also be prefixed with a `GROUP_REGEX=<group-to-sync` to sync a single group at a time, as syncing the entire group structure may take a long time. 

    ```
    kubectl --namespace lagoon-core exec -it deploy/lagoon-core-api -- \
        sh -c yarn sync:opendistro-security
    ```
Check [https://github.com/uselagoon/lagoon/releases](https://github.com/uselagoon/lagoon/releases) for additional upgrades.

## Database Backups

You may want to backup the databases before upgrading Lagoon Core, the following will create backups you can use to restore from if required.
You can delete them afterwards.

### API DB
```
kubectl --namespace lagoon-core exec -it lagoon-core-api-db-0 -- \
    sh -c 'mysqldump --max-allowed-packet=500M --events \
    --routines --quick --add-locks --no-autocommit \
    --single-transaction infrastructure | gzip -9 > \
    /var/lib/mysql/backup/$(date +%Y-%m-%d_%H%M%S).infrastructure.sql.gz'
```

### Keycloak DB
```
kubectl --namespace lagoon-core exec -it lagoon-core-keycloak-db-0 -- \
    sh -c 'mysqldump --max-allowed-packet=500M --events \
    --routines --quick --add-locks --no-autocommit \
    --single-transaction keycloak | gzip -9 > \
    /var/lib/mysql/backup/$(date +%Y-%m-%d_%H%M%S).keycloak.sql.gz'
```
