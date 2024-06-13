# 更新

1. Helmを使用して最新のチャートをダウンロードします。

    ```bash title="最新のチャートをダウンロード"
    helm repo update
    ```

2. `helm diff`を使って変更点を確認します（[https://github.com/databus23/helm-diff](https://github.com/databus23/helm-diff)）。

    ```bash title="変更点を確認"
    helm diff upgrade --install --create-namespace --namespace lagoon-core \
        -f values.yml lagoon-core lagoon/lagoon-core
    ```

3. 任意のHelm操作前に、Lagoonデータベースの[バックアップ](#database-backups)を取ります。
   また、データベース移行スクリプトがinitContainersで実行されるのを支援するために、APIを単一のポッドにスケーリングすることもお勧めします。

4. Helmを使用してアップグレードを実行します。

    ```bash title="アップグレードを実行"
    helm upgrade --install --create-namespace --namespace lagoon-core \
        -f values.yaml lagoon-core lagoon/lagoon-core
    ```

5. （Lagoon v2.11.0以降、このステップは不要になりました）
    Lagoon Coreをアップグレードする場合、アップグレード後の移行を行うために`rerun_initdb.sh`スクリプトを実行することを確認してください。

    ```bash title="スクリプトを実行"
    kubectl --namespace lagoon-core exec -it lagoon-core-api-db-0 -- \
        sh -c /rerun_initdb.sh
    ```

6. APIポッドを元の数に戻してスケールアップします。 レベル。

7. Lagoon Coreをアップグレードし、OpenSearchのグループ/ユーザー同期を有効にしている場合、OpenSearchのグループを更新するために`sync:opendistro-security`スクリプトを実行する必要がある場合があります。このコマンドは、全体のグループ構造の同期に時間がかかる場合、一度に1つのグループを同期するために`GROUP_REGEX=<group-to-sync`でプレフィックスを付けることもできます。

    ```bash title="スクリプトの実行"
    kubectl --namespace lagoon-core exec -it deploy/lagoon-core-api -- \
        sh -c yarn sync:opendistro-security
    ```

追加のアップグレードについては、[https://github.com/uselagoon/lagoon/releases](https://github.com/uselagoon/lagoon/releases)をご覧ください。

## データベースのバックアップ

Lagoon Coreをアップグレードする前にデータベースをバックアップしたい場合があります。以下の手順でバックアップを作成し、必要に応じてそれらを使用して復元することができます。後でそれらを削除することもできます。

### API DB

```bash title="API DBのバックアップ"
kubectl --namespace lagoon-core exec -it lagoon-core-api-db-0 -- \
    sh -c 'mysqldump --max-allowed-packet=500M --events \
    --routines --quick --add-locks --no-autocommit \
    --single-transaction infrastructure | gzip -9 > \
    /var/lib/mysql/backup/$(date +%Y-%m-%d_%H%M%S).infrastructure.sql.gz'
```
 ### Keycloak DB

```bash title="Keycloak DBのバックアップ"
kubectl --namespace lagoon-core exec -it lagoon-core-keycloak-db-0 -- \
    sh -c 'mysqldump --max-allowed-packet=500M --events \
    --routines --quick --add-locks --no-autocommit \
    --single-transaction keycloak | gzip -9 > \
    /var/lib/mysql/backup/$(date +%Y-%m-%d_%H%M%S).keycloak.sql.gz'
```
