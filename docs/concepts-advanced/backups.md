# Backups

Lagoon makes use of the [k8up operator](https://github.com/vshn/k8up) to provide backup functionality for both database data as well as containers' persistent storage volumes. This operator utilizes [Restic](https://github.com/restic/restic) to catalog these backups, which is typically connected to an AWS S3 bucket to provide secure, off-site storage for the generated backups.

## Production Environments

### Backup Schedules

Backups of databases and containers' persistent storage volumes happens nightly within production environments by default.

If a different backup schedule for production backups is required, this can be specified at a project level via setting the "Backup Schedule" variables in the project's [.lagoon.yml](../using-lagoon-the-basics/lagoon-yml.md#backup-schedule) file.

### Backup Retention

Production environment backups will be held according to the following schedule by default:

* Daily: 7
* Weekly: 6
* Monthly: 1
* Hourly: 0

If a different retention period for production backups is required, this can be specified at a project level via setting the "Backup Retention" variables in the project's [.lagoon.yml](../using-lagoon-the-basics/lagoon-yml.md#backup-retention) file.

## Development Environments

Backups of development environments are attempted nightly and are strictly a best effort service.

## Retrieving Backups

Backups stored in Restic will be tracked within Lagoon, and can be recovered via the "Backup" tab for each environment in the Lagoon UI.

## Custom Backup and/or Restore Locations

Lagoon supports custom backup and restore locations via the use of the "[Custom Backup Settings](../using-lagoon-advanced/environment-variables.md#custom-backup-settings)" and/or "[Custom Restore Settings](../using-lagoon-advanced/environment-variables.md#custom-restore-settings)" variables stored in the Lagoon API for each project.

!!! danger
    Proceed with caution: Setting these variables will override backup/restore storage locations that may be configured at a cluster level. Any misconfiguration will cause backup/restore failures.
