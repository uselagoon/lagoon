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
};

module.exports = Sql;
