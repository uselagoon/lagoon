import { knex } from '../../util/db';

export const Sql = {
  selectBackup: id =>
    knex('environment_backup')
      .where('id', '=', id)
      .toString(),
  selectBackupByBackupId: (backupId: number) =>
    knex('environment_backup')
      .where('backup_id', '=', backupId)
      .toString(),
  selectEnvVariablesByProjectsById: (projectId: number) =>
    knex('env_vars')
      .where('project', projectId)
      .toString(),
  selectBackupsByEnvironmentId: ({
    environmentId,
    includeDeleted
  }: {
    environmentId: number;
    includeDeleted: boolean;
  }) => {
    const query = knex('environment_backup')
      .where('environment', environmentId)
      .orderBy('created', 'desc')
      .orderBy('id', 'desc');

    if (includeDeleted) {
      return query.toString();
    }

    return query.where('deleted', '=', '0000-00-00 00:00:00').toString();
  },
  insertBackup: ({
    id,
    environment,
    source,
    backupId,
    created
  }: {
    id: number;
    environment: number;
    source: string;
    backupId: string;
    created: string;
  }) =>
    knex('environment_backup')
      .insert({
        id,
        environment,
        source,
        backup_id: backupId,
        created
      })
      .toString(),
  deleteBackup: (backupId: string) =>
    knex('environment_backup')
      .where('backup_id', backupId)
      .update({ deleted: knex.fn.now() })
      .toString(),
  truncateBackup: () =>
    knex('environment_backup')
      .truncate()
      .toString(),
  selectRestore: (id: number) =>
    knex('backup_restore')
      .where('id', '=', id)
      .toString(),
  selectRestoreByBackupId: (backupId: string) =>
    knex('backup_restore')
      .where('backup_id', backupId)
      .toString(),
  insertRestore: ({
    id,
    backupId,
    status,
    restoreLocation,
    created
  }: {
    id: number;
    backupId: string;
    status: string;
    restoreLocation: string;
    created: string;
  }) =>
    knex('backup_restore')
      .insert({
        id,
        backupId,
        status,
        restoreLocation,
        created
      })
      .toString(),
  updateRestore: ({
    backupId,
    patch
  }: {
    backupId: string;
    patch: { [key: string]: any };
  }) =>
    knex('backup_restore')
      .where('backup_id', backupId)
      .update(patch)
      .toString(),
  selectPermsForRestore: (backupId: string) =>
    knex('backup_restore')
      .select({ pid: 'environment.project' })
      .join(
        'environment_backup',
        'backup_restore.backup_id',
        '=',
        'environment_backup.id'
      )
      .join(
        'environment',
        'environment_backup.environment',
        '=',
        'environment.id'
      )
      .where('backup_restore.backup_id', backupId)
      .toString(),
  selectPermsForBackup: (backupId: string) =>
    knex('environment_backup')
      .select({ pid: 'environment.project' })
      .join(
        'environment',
        'environment_backup.environment',
        '=',
        'environment.id'
      )
      .where('environment_backup.backup_id', backupId)
      .toString()
};
