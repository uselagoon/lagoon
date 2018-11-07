// @flow

const { knex } = require('../../util/db');

/* ::

import type {SqlObj} from '../';

*/

const Sql /* : SqlObj */ = {
  selectBackup: id =>
    knex('environment_backup')
      .where('id', '=', id)
      .toString(),
  selectBackupsByEnvironmentId: ({ environmentId } /* : { environmentId: number} */) =>
    knex('environment_backup')
      .join('environment as e', 'e.id', '=', 'environment_backup.environment')
      .select(
        'environment_backup.*',
      )
      .where('e.id', environmentId)
      .toString(),
  insertBackup: ({
    id, environment, source, backupId, created,
  } /* : {id: number, environment: number, source: string, backupId: string, created: string} */) =>
    knex('environment_backup')
      .insert({
        id,
        environment,
        source,
        backup_id: backupId,
        created,
      })
      .toString(),
  truncateBackup: () =>
    knex('environment_backup')
      .truncate()
      .toString(),
  selectRestore: (id /* : number */) =>
    knex('backup_restore')
      .where('id', '=', id)
      .toString(),
  selectRestoresByBackupId: (id /* : number */) =>
    knex('backup_restore')
      .where('backup', id)
      .toString(),
  insertRestore: ({
    id, backup, status, restoreLocation, created,
  } /* : {id: number, backup: number, status: string, restoreLocation: string, created: string} */) =>
    knex('backup_restore')
      .insert({
        id,
        backup,
        status,
        restoreLocation,
        created,
      })
      .toString(),
  updateRestore: ({ id, patch } /* : {id: number, patch: Object} */) =>
    knex('backup_restore')
      .where('id', id)
      .update(patch)
      .toString(),
  selectPermsForRestore: (id /* : number */) =>
    knex('backup_restore')
      .select({ pid: 'project.id', cid: 'project.customer' })
      .join('environment_backup', 'backup_restore.backup', '=', 'environment_backup.id')
      .join('environment', 'environment_backup.environment', '=', 'environment.id')
      .join('project', 'environment.project', '=', 'project.id')
      .where('backup_restore.id', id)
      .toString(),
  selectPermsForBackup: (id /* : number */) =>
    knex('environment_backup')
      .select({ pid: 'project.id', cid: 'project.customer' })
      .join('environment', 'environment_backup.environment', '=', 'environment.id')
      .join('project', 'environment.project', '=', 'project.id')
      .where('environment_backup.id', id)
      .toString(),
};

module.exports = Sql;
