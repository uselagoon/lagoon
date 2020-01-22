---
description: >-
  Lagoon differentiates between three backup categories: Short-, Mid- and
  Long-Term Backups.
---

# Backups

## Short-Term Backups

These Backups are provided by Lagoon itself and are implemented for Databases only. Lagoon will automatically instruct the `mariadb` and `postgres` [services types](service_types.md) to setup a cron which creates backups once a day \(see example [backup script](https://github.com/amazeeio/lagoon/blob/docs/images/mariadb/mysql-backup.sh) for mariadb\). These backups are kept for four days and automatically cleaned up after that.

These Backups are accessible for developers directly with connecting via the [Remote Shell](remote_shell.md) to the corresponding container \(like `mariadb`\) and checking the [folder](https://github.com/amazeeio/lagoon/blob/docs/images/mariadb/mysql-backup.sh#L24) where the backups are stored\). They can then be downloaded, extracted or in any other way used.

## Mid-Term Backups

Mid-Term Backups are not automatically provided by Lagoon and depend heavy on the underlining Infrastructure where Kubernetes and OpenShift are running. Check with your Lagoon Administrator what Backups are created on your infrastructure.

For amazee.io infrastructure: Every persistent storage and Docker Images are backed up daily for a week, and weekly for a month. If you need such access to such a Backup, check with the Support Team, the will help you.

## Long-Term Backups

Long-Term Backups refer to Backups that are kept for multiple months and years. These types of Backups also depend heavy on the underlining Infrastructure. Check with your Lagoon Administrator what Backups are created on your infrastructure.

