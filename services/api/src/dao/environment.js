// @flow

const R = require('ramda');
const {
  ifNotAdmin,
  inClauseOr,
  isPatchEmpty,
  knex,
  prepare,
  query,
  whereAnd,
} = require('./utils');

/* ::

import type {Cred, ResolversObj} from './';

*/

const Sql = {
  updateEnvironment: (
    cred /* : Cred */,
    input /* : {id: number, patch: Object} */,
  ) => {
    const { id, patch } = input;

    return knex('environment')
      .where('id', '=', id)
      .update(patch)
      .toString();
  },
  selectEnvironmentById: (id /* : number */) =>
    knex('environment')
      .where('id', '=', id)
      .toString(),
  truncateEnvironment: () =>
    knex('environment')
      .truncate()
      .toString(),
};

const getEnvironmentByName = ({ sqlClient }) => async (cred, args) => {
  const { customers, projects } = cred.permissions;
  const str = `
    SELECT *
    FROM environment
    WHERE name = :name AND
    project = :project
    ${ifNotAdmin(
    cred.role,
    `AND (${inClauseOr([
      ['customer', customers],
      ['project.id', projects],
    ])})`,
  )}
  `;

  const prep = prepare(sqlClient, str);

  const rows = await query(sqlClient, prep(args));

  return rows[0];
};

const getEnvironmentsByProjectId = ({ sqlClient }) => async (
  cred,
  pid,
  args,
) => {
  const { projects } = cred.permissions;

  if (cred.role !== 'admin' && !R.contains(pid, projects)) {
    throw new Error('Unauthorized');
  }

  const prep = prepare(
    sqlClient,
    `
      SELECT *
      FROM environment e
      WHERE e.project = :pid
      ${args.includeDeleted ? '' : 'AND deleted = "0000-00-00 00:00:00"'}
      ${args.type ? 'AND e.environment_type = :type' : ''}
    `,
  );

  const rows = await query(sqlClient, prep({ pid, type: args.type }));

  return rows;
};

const getEnvironmentByDeploymentId = ({ sqlClient }) => async (
  cred,
  deployment_id,
) => {
  const { customers, projects } = cred.permissions;
  const prep = prepare(
    sqlClient,
    `SELECT
        e.*
      FROM deployment d
      JOIN environment e on d.environment = e.id
      JOIN project p ON e.project = p.id
      WHERE d.id = :deployment_id
      ${ifNotAdmin(
    cred.role,
    `AND (${inClauseOr([['p.customer', customers], ['p.id', projects]])})`,
  )}
      LIMIT 1
    `,
  );

  const rows = await query(sqlClient, prep({ deployment_id }));

  return rows ? rows[0] : null;
};

const getEnvironmentStorageByEnvironmentId = ({ sqlClient }) => async (
  cred,
  eid,
) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const prep = prepare(
    sqlClient,
    `
      SELECT *
      FROM environment_storage es
      WHERE es.environment = :eid
    `,
  );

  const rows = await query(sqlClient, prep({ eid }));

  return rows;
};

const getEnvironmentStorageMonthByEnvironmentId = ({ sqlClient }) => async (
  cred,
  eid,
  args,
) => {
  const str = `
    SELECT
      SUM(bytes_used) as bytes_used, max(DATE_FORMAT(updated, '%Y-%m')) as month
    FROM
      environment_storage
    WHERE
      environment = :eid
      AND YEAR(updated) = YEAR(STR_TO_DATE(:month, '%Y-%m'))
      AND MONTH(updated) = MONTH(STR_TO_DATE(:month, '%Y-%m'))
  `;

  const prep = prepare(sqlClient, str);

  const rows = await query(sqlClient, prep({ eid, month: args.month }));

  return rows[0];
};

const getEnvironmentHoursMonthByEnvironmentId = ({ sqlClient }) => async (
  cred,
  eid,
  args,
) => {
  const str = `
    SELECT
      e.created, e.deleted
    FROM
      environment e
    WHERE
      e.id = :eid
  `;

  const prep = prepare(sqlClient, str);

  const rows = await query(sqlClient, prep({ eid }));

  const { created, deleted } = rows[0];

  const created_date = new Date(created);
  const deleted_date = new Date(deleted);

  const now = new Date();

  // Generate date object of the requested month, but with the first day, hour, minute, seconds and milliseconds
  const interested_month_start = new Date(args.month) || new Date();
  interested_month_start.setDate(1);
  interested_month_start.setHours(0);
  interested_month_start.setMinutes(0);
  interested_month_start.setSeconds(0);
  interested_month_start.setMilliseconds(0);

  if (interested_month_start > now) {
    throw new Error("Can't predict the future, yet.");
  }

  // Generate Date Variable with the month we are interested in plus one month
  let interested_month_end = new Date(interested_month_start);
  interested_month_end.setMonth(interested_month_start.getMonth() + 1);

  // If the the the interested month end is in the future, we use the current time for real time cost calculations
  if (interested_month_end > now) {
    interested_month_end = now;
  }

  // calculate the month in format `YYYY-MM`. getMonth() does not return with a leading zero and starts its index at 0 as well.
  const month_leading_zero =
    interested_month_start.getMonth() + 1 < 10
      ? `0${interested_month_start.getMonth() + 1}`
      : interested_month_start.getMonth() + 1;
  const month = `${interested_month_start.getFullYear()}-${month_leading_zero}`;

  // Created Date is created after the interested month: Ran for 0 hours in the requested month
  if (created_date > interested_month_end) {
    return { month, hours: 0 };
  }

  // Environment was deleted before the month we are interested in: Ran for 0 hours in the requested month
  if (
    deleted_date < interested_month_start &&
    deleted_date !== '0000-00-00 00:00:00'
  ) {
    return { month, hours: 0 };
  }

  let date_from;
  let date_to;

  if (created_date >= interested_month_start) {
    // Environment was created within the interested month
    date_from = created_date;
  } else {
    // Environment was created before the interested month
    date_from = interested_month_start;
  }

  if (
    deleted === '0000-00-00 00:00:00' ||
    deleted_date > interested_month_end
  ) {
    // Environment is not deleted yet or was deleted after the interested month
    date_to = interested_month_end;
  } else {
    // Environment was deleted in the interested month
    date_to = deleted_date;
  }

  const hours = Math.ceil(Math.abs(date_to - date_from) / 36e5);
  return { month, hours };
};

const getEnvironmentHitsMonthByEnvironmentId = ({ esClient }) => async (
  cred,
  openshiftProjectName,
  args,
) => {
  const interested_month = args.month ? new Date(args.month) : new Date();
  const now = new Date();
  const interested_month_relative =
    interested_month.getMonth() - now.getMonth();
  // Elasticsearch needs relative numbers with + or - in front. The - already exists, so we add the + if it's a positive number.
  const interested_month_relative_plus_sign =
    (interested_month_relative < 0 ? '' : '+') + interested_month_relative;

  try {
    const result = await esClient.count({
      index: `router-logs-${openshiftProjectName}-*`,
      body: {
        query: {
          bool: {
            must: [
              {
                range: {
                  '@timestamp': {
                    gte: `now${interested_month_relative_plus_sign}M/M`,
                    lte: `now${interested_month_relative_plus_sign}M/M`,
                  },
                },
              },
            ],
            must_not: [
              {
                match_phrase: {
                  request_header_useragent: {
                    query: 'StatusCake',
                  },
                },
              },
            ],
          },
        },
      },
    });

    const response = {
      total: result.count,
    };
    return response;
  } catch (e) {
    if (
      e.body.error.type &&
      e.body.error.type === 'index_not_found_exception'
    ) {
      return { total: 0 };
    }
    throw e;
  }
};

const getEnvironmentByOpenshiftProjectName = ({ sqlClient }) => async (
  cred,
  args,
) => {
  const { customers, projects } = cred.permissions;
  const str = `
    SELECT
      e.*
    FROM
      environment e
      JOIN project p ON e.project = p.id
      JOIN customer c ON p.customer = c.id
    WHERE e.openshift_project_name = :openshift_project_name
    ${ifNotAdmin(
    cred.role,
    `AND (${inClauseOr([['c.id', customers], ['p.id', projects]])})`,
  )}
  `;

  const prep = prepare(sqlClient, str);

  const rows = await query(sqlClient, prep(args));

  return rows[0];
};

const addOrUpdateEnvironment = ({ sqlClient }) => async (cred, input) => {
  const { projects } = cred.permissions;
  const pid = input.project.toString();

  if (cred.role !== 'admin' && !R.contains(pid, projects)) {
    throw new Error('Project creation unauthorized.');
  }
  const prep = prepare(
    sqlClient,
    `
      CALL CreateOrUpdateEnvironment(
        :name,
        :project,
        :deploy_type,
        :environment_type,
        :openshift_project_name
      );
    `,
  );

  const rows = await query(sqlClient, prep(input));
  const environment = R.path([0, 0], rows);

  return environment;
};

const addOrUpdateEnvironmentStorage = ({ sqlClient }) => async (
  cred,
  input,
) => {
  if (cred.role !== 'admin') {
    throw new Error('EnvironmentStorage creation unauthorized.');
  }
  const prep = prepare(
    sqlClient,
    `
      CALL CreateOrUpdateEnvironmentStorage(
        :environment,
        :persistent_storage_claim,
        :bytes_used
      );
    `,
  );

  const rows = await query(sqlClient, prep(input));
  const environment = R.path([0, 0], rows);

  return environment;
};

const getEnvironmentByEnvironmentStorageId = ({ sqlClient }) => async (
  cred,
  esid,
) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  const prep = prepare(
    sqlClient,
    `
      SELECT e.*
      FROM environment_storage es
      JOIN environment e ON es.environment = e.id
      WHERE es.id = :esid
    `,
  );

  const rows = await query(sqlClient, prep({ esid }));

  return rows ? rows[0] : null;
};

const deleteEnvironment = ({ sqlClient }) => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const prep = prepare(sqlClient, 'CALL DeleteEnvironment(:name, :project)');
  await query(sqlClient, prep(input));

  // TODO: maybe check rows for changed result
  return 'success';
};

const updateEnvironment = ({ sqlClient }) => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  const id = input.id;
  await query(sqlClient, Sql.updateEnvironment(cred, input));

  const rows = await query(sqlClient, Sql.selectEnvironmentById(id));

  return R.prop(0, rows);
};

const getAllEnvironments = ({ sqlClient }) => async (cred, args) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const where = whereAnd([
    args.createdAfter ? 'created >= :created_after' : '',
    args.type ? 'environment_type = :type' : '',
    'deleted = "0000-00-00 00:00:00"',
  ]);

  const prep = prepare(sqlClient, `SELECT * FROM environment ${where}`);
  const rows = await query(sqlClient, prep(args));
  return rows;
};

const deleteAllEnvironments = ({ sqlClient }) => async ({ role }) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  await query(sqlClient, Sql.truncateEnvironment());

  // TODO: Check rows for success
  return 'success';
};

const Resolvers /* : ResolversObj */ = {
  addOrUpdateEnvironment,
  addOrUpdateEnvironmentStorage,
  getEnvironmentByName,
  getEnvironmentByOpenshiftProjectName,
  getEnvironmentHoursMonthByEnvironmentId,
  getEnvironmentStorageByEnvironmentId,
  getEnvironmentStorageMonthByEnvironmentId,
  getEnvironmentHitsMonthByEnvironmentId,
  getEnvironmentByEnvironmentStorageId,
  getEnvironmentByDeploymentId,
  deleteEnvironment,
  getEnvironmentsByProjectId,
  updateEnvironment,
  getAllEnvironments,
  deleteAllEnvironments,
};

module.exports = {
  Sql,
  Resolvers,
};
