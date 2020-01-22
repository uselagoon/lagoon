# Backups

Lagoon differentiates between three backup categories: **short**-, **mid**- and **long**-term backups.

## Short-Term Backups

These backups are provided by Lagoon itself and are implemented for databases only. Lagoon will automatically instruct the `mariadb` and `postgres` [services types](./service_types.md) to setup a cron which creates backups once a day (see example [backup script](https://github.com/amazeeio/lagoon/blob/docs/images/mariadb/mysql-backup.sh) for mariadb). These backups are kept for four days and automatically cleaned up after that.

These backups are accessible to developers directly by connecting via the [remote shell](./remote_shell.md) to the corresponding container (like `mariadb`) and checking the [folder](https://github.com/amazeeio/lagoon/blob/docs/images/mariadb/mysql-backup.sh#L24) where the backups are stored). They can then be downloaded, extracted or used in any other way.

## Mid-Term Backups

Mid-term backups are not automatically provided by Lagoon, and depend heavily on the underlying infrastructure where Kubernetes and OpenShift are running. Check with your Lagoon administrator to find out what backups are created on your infrastructure.

For the amazee.io infrastructure:

Each persistent storage and Docker image is backed up daily for a week, and weekly for a month. If you need access to these backups, check with the Lagoon support team, and they will help you.

## Long-Term Backups

Long-term backups refer to backups that are kept for multiple months and years. These types of backups also depend heavily on the underlying infrastructure, and often involved a technology like AWS Glacier. Check with your Lagoon administrator to find out about what backups are created on your infrastructure.
