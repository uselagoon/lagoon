---
description: >-
  Lagoon differentiates between three backup categories: short-, mid- and
  long-term Backups.
---

# Backups

## Short-Term Backups

These Backups are provided by Lagoon itself and are implemented for databases only. Lagoon will automatically instruct the `MariaDB` and `Postgres` [services types](service_types.md) to set up a cron job which creates backups once a day \(see example [backup script](https://github.com/amazeeio/lagoon/blob/docs/images/mariadb/mysql-backup.sh) for mariadb\). These backups are kept for four days and automatically cleaned up after that.

These backups are accessible for developers directly with connecting via the [remote shell](remote_shell.md) to the corresponding container \(like `mariadb`\) and checking the [folder](https://github.com/amazeeio/lagoon/blob/docs/images/mariadb/mysql-backup.sh#L24) where the backups are stored\). They can then be downloaded, extracted, or used in any other way.

## Mid-Term Backups

Mid-term backups are not automatically provided by Lagoon and depend heavily on the underlying infrastructure where Kubernetes and OpenShift are running. Check with your Lagoon Administrator what Backups are created on your infrastructure.

For amazee.io infrastructure: Every persistent storage and Docker images are backed up daily for a week, and weekly for a month. If you need such access to such a backup, check with the Support team, the will help you.

## Long-Term Backups

Long-Term Backups refer to Backups that are kept for multiple months and years. These types of backups also depend heavily on the underlying Infrastructure. Check with your Lagoon administrator what Backups are created on your infrastructure.

