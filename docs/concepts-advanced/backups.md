# Backups

Lagoon provides multiple methods for backing up environment data. Automated
backups are done without user interaction and manual backups are done on-demand,
as requested by users.

## Automated Backups

By default, Lagoon will run nightly backups for each database and persistent
volume. Daily backups are kept for seven days, and weekly backups are kept for
six weeks.

Lagoon keeps an up to date list of available backups. To view them, check the
`Backups` tab of an environment in the Lagoon UI or use the Lagoon CLI (`lagoon
list backups --help`).

!!! note "Lagoon administrators"
    Automated backups are reliant on the [installation of
    K8up](../installing-lagoon/requirements.md#k8up-for-backups). Default settings
    can be [configured](https://github.com/uselagoon/build-deploy-tool/blob/main/docs/buildrequirements.md#backup-related-variables)
    per Lagoon remote.

### Downloading

In order to download the contents of a backup, it must first be retrieved. Click
the `Retrieve` button in the UI or run `lagoon retrieve --help`. After some time
(how long depends on how large the backup is), it will be available to download.
Click the `Download` button in the UI or run `lagoon get backup --help`.

### Configuring

Automated backups can be disabled by setting the `LAGOON_BACKUPS_DISABLED=true`
[environment
variable](./environment-variables.md#buildtime).

The storage bucket name can be changed by setting the `LAGOON_BAAS_BUCKET_NAME`
environment variable. **Do not change this unless asked by your Lagoon
administrator.**

#### Backup Schedules

Schedules use a cron-compatible syntax with the default being to run nightly
backups (`M H(22-2) * * *`). The `M` is special to Lagoon to allow for load
balancing, and must be set, any other value will cause build failures.

!!! Info "Timezones:"

    Backup schedules use the cluster's local timezone.

Each environment type can be configured to have it's own schedule:

**Production**

* The schedule can be set in code by changing the `backup-schedule` in the
  [.lagoon.yml](../concepts-basics/lagoon-yml.md#backup-schedule) file.
* The schedule can be set using environment variables:

    | Name                                       | Value         |
    |:-------------------------------------------|:--------------|
    | `LAGOON_FEATURE_FLAG_CUSTOM_BACKUP_CONFIG` | `enabled`     |
    | `LAGOON_BACKUP_PROD_SCHEDULE`              | Cron schedule |

**Development**

The schedule can be set using environment variables:

| Name                                       | Value         |
|:-------------------------------------------|:--------------|
| `LAGOON_FEATURE_FLAG_CUSTOM_BACKUP_CONFIG` | `enabled`     |
| `LAGOON_BACKUP_DEV_SCHEDULE`               | Cron schedule |

**Pull Request**

The schedule can be set using environment variables:

| Name                                       | Value         |
|:-------------------------------------------|:--------------|
| `LAGOON_FEATURE_FLAG_CUSTOM_BACKUP_CONFIG` | `enabled`     |
| `LAGOON_BACKUP_PR_SCHEDULE`                | Cron schedule |

#### Backup Retention

Backups will be held according to the following retention policy by default:

* Daily: 7
* Weekly: 6

Production environments can set a different retention policy by changing
`backup-retention` in the
[.lagoon.yml](../concepts-basics/lagoon-yml.md#backup-retention)
file.

!!! warning
    Retention policies are evaluated by Restic, a 3rd party open source
    software. Make sure you are familiar with the [policy
    options](https://restic.readthedocs.io/en/v0.17.1/060_forget.html#removing-snapshots-according-to-a-policy)
    as they can be unintuitive.

Other environment types cannot set a different retention policy.

#### Storage Location

Lagoon supports custom backup locations and credentials for any project when all
four of the following variables are set as `BUILD` type variables. The
environment variables need to be set at the project level (not per environment),
and requires a Lagoon deployment after setting them (for every environment).

!!! danger
    Using custom settings will override cluster default. Any misconfiguration or
    invalid/expired credentials may cause automated backups to fail or be
    inaccessible.

| Environment variable name              | Purpose                                                                                                                                                               |
|:---------------------------------------|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `LAGOON_BAAS_CUSTOM_BACKUP_ENDPOINT`   | Specify the S3 compatible endpoint where any Lagoon initiated backups should be stored. An example for S3 Sydney would be: `https://s3.ap-southeast-2.amazonaws.com`. |
| `LAGOON_BAAS_CUSTOM_BACKUP_BUCKET`     | Specify the bucket name where any Lagoon initiated backups should be stored.An example custom setting would be: `example-restore-bucket`.                             |
| `LAGOON_BAAS_CUSTOM_BACKUP_ACCESS_KEY` | Specify the access key Lagoon should use to access the custom backup bucket. An example custom setting would be: `AKIAIOSFODNN7EXAMPLE`.                              |
| `LAGOON_BAAS_CUSTOM_BACKUP_SECRET_KEY` | Specify the secret key Lagoon should use to access the custom backup bucket. An example custom setting would be: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`.          |

No public access is needed on the S3 bucket and can be made entirely private.

Lagoon will automatically prune the files in these S3 buckets, so no object
retention policy is needed at the bucket level.

#### Retrieval Location

Lagoon supports custom retrieval locations and credentials for any project when
all four of the following variables are set as `BUILD` type environment
variables. The environment variables need to be set at the project level (not
per environment), and requires a Lagoon deployment after setting them (for every
environment).

!!! danger
    Using custom settings will override cluster default. Any misconfiguration or
    invalid/expired credentials may cause retrieval of backups to fail or be
    inaccessible.

| Environment variable name               | Purpose                                                                                                                                                                |
|:----------------------------------------|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `LAGOON_BAAS_CUSTOM_RESTORE_ENDPOINT`   | Specify the S3 compatible endpoint where any Lagoon initiated restores should be stored. An example for S3 Sydney would be: `https://s3.ap-southeast-2.amazonaws.com`. |
| `LAGOON_BAAS_CUSTOM_RESTORE_BUCKET`     | Specify the bucket name where any Lagoon initiated restores should be stored.An example custom setting would be: `example-restore-bucket`.                             |
| `LAGOON_BAAS_CUSTOM_RESTORE_ACCESS_KEY` | Specify the access key Lagoon should use to access the custom restore bucket. An example custom setting would be: `AKIAIOSFODNN7EXAMPLE`.                              |
| `LAGOON_BAAS_CUSTOM_RESTORE_SECRET_KEY` | Specify the secret key Lagoon should use to access the custom restore bucket. An example custom setting would be: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`.          |

The S3 bucket must have public access enabled, as Lagoon will create [presigned
URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html)
for the objects inside the bucket as needed.

An example AWS IAM policy that you can create to allow access to just the S3
bucket `example-restore-bucket` is:

```json title="aws_iam_restore_policy.json"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetBucketLocation",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::example-restore-bucket"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:GetBucketLocation",
        "s3:PutObjectAcl"
      ],
      "Resource": [
         "arn:aws:s3:::example-restore-bucket/*"
      ]
    }
  ]
}
```

For increased security and reduced storage costs you can opt into [removing
restored backups after a set
lifetime](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
(e.g. 7 days). Lagoon caters for this scenario gracefully and will re-create any
restored snapshots as needed.

## Manual Backups

Users can manually backup databases and files by running a task, syncing data
from one environment to another, or by running custom commands in containers.

### Tasks

For Drupal projects, there are tasks available that will run drush backups. For
non-Drupal projects, a [custom task](../using-lagoon-advanced/custom-tasks.md) can
be created to take a backup.

<iframe width="560" height="315" src="https://www.youtube.com/embed/bluTyxKqLbw"
title="YouTube video player" frameborder="0"
allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
allowfullscreen></iframe>

### Sync

For Drupal projects, the use of `drush` to sync the database and files is
recommneded. For non-Drupal projects,
[lagoon-sync](https://github.com/uselagoon/lagoon-sync) can be added to the
project and used to sync the database and files.

### Manual

The Lagoon cli base images contain all the tools needed to backup databases and
transfer files. A user familiar with `mysqldump` and `rsync` can make manual
backups.

## Restoring Backups

Lagoon cannot automatically restore backups. After downloading the backups,
users can restore them manually by [copying](../interacting/ssh.md#copying-files)
them to the desired environment.
