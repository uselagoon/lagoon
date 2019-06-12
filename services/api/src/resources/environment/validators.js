// @flow

/* ::
import type MariaSQL from 'mariasql';
*/

const R = require('ramda');
const { prepare, query } = require('../../util/db');
const Sql = require('./sql');

const Validators = (sqlClient /* : MariaSQL */) => ({
  environmentExists: async (environmentId /* : number */) => {
    const env = await query(
      sqlClient,
      Sql.selectEnvironmentById(environmentId),
    );

    if (R.has('info', env)) {
      throw new Error(`Environment ID ${environmentId} doesn't exist.`);
    }
  },
  environmentsHaveSameProject: async (environmentIds /* : number[] */) => {
    const preparedQuery = prepare(
      sqlClient,
      `
      SELECT DISTINCT project FROM environment WHERE id in (?)
    `,
    );

    const rows = await query(sqlClient, preparedQuery([environmentIds]));
    const projectIds = R.pluck('project', rows);

    if (R.length(R.uniq(projectIds)) > 1) {
      throw new Error(
        `Environments ${environmentIds.join(
          ',',
        )} do not belong to the same project.`,
      );
    }
  },
  environmentHasService: async (
    environmentId /* : number */,
    service /* : string */,
  ) => {
    const rows = await query(
      sqlClient,
      Sql.selectServicesByEnvironmentId(environmentId),
    );

    if (!R.contains(service, R.pluck('name', rows))) {
      throw new Error(`Environment ${environmentId} has no service ${service}`);
    }
  },
});

module.exports = Validators;
