// @flow

const R = require('ramda');
const { prepare, query } = require('../../util/db');
const sqlClient = require('../../clients/sqlClient');
const Sql = require('./sql');

const Validators = {
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
  environmentHasService: async (environmentId /* : number */, service /* : string */) => {
    const rows = await query(sqlClient, Sql.selectServicesByEnvironmentId(environmentId));

    if (!R.contains(service, R.pluck('name', rows))) {
      throw new Error(`Environment ${environmentId} has no service ${service}`);
    }
  },
  userAccessEnvironment: async (
    credentials /* : Object */,
    environmentId /* : number */,
  ) => {
    const {
      role,
      permissions: { customers, projects },
    } = credentials;

    if (role === 'admin') {
      return;
    }

    const rows = await query(
      sqlClient,
      Sql.selectPermsForEnvironment(environmentId),
    );

    if (
      !R.contains(R.path(['0', 'pid'], rows), projects) &&
      !R.contains(R.path(['0', 'cid'], rows), customers)
    ) {
      throw new Error(`No access to environment ${environmentId}.`);
    }
  },
};

module.exports = Validators;
