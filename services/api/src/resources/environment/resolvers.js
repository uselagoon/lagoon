// @flow

const R = require('ramda');
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { createRemoveTask } = require('@lagoon/commons/src/tasks');
const esClient = require('../../clients/esClient');
const sqlClient = require('../../clients/sqlClient');
const {
  ifNotAdmin,
  inClauseOr,
  isPatchEmpty,
  prepare,
  query,
  whereAnd,
} = require('../../util/db');
const Sql = require('./sql');
const projectSql = require('../project/sql');
const projectHelpers = require('../project/helpers');

/* ::

import type {ResolversObj} from '../';

*/

const deployTypeToString = R.cond([
  [R.equals('BRANCH'), R.toLower],
  [R.equals('PULLREQUEST'), R.toLower],
  [R.equals('PROMOTE'), R.toLower],
  [R.T, R.identity],
]);

const envTypeToString = R.cond([
  [R.equals('PRODUCTION'), R.toLower],
  [R.equals('DEVELOPMENT'), R.toLower],
  [R.T, R.identity],
]);

const getEnvironmentByName = async (
  root,
  args,
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
) => {
  const str = `
    SELECT *
    FROM environment
    WHERE name = :name AND
    project = :project
    ${ifNotAdmin(
    role,
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

const getEnvironmentsByProjectId = async (
  { id: pid },
  unformattedArgs,
  {
    credentials: {
      role,
      permissions: { projects },
    },
  },
) => {
  const args = R.compose(R.over(R.lensProp('type'), envTypeToString))(
    unformattedArgs,
  );

  if (role !== 'admin' && !R.contains(pid, projects)) {
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

const getEnvironmentByDeploymentId = async (
  { id: deployment_id },
  args,
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
) => {
  const prep = prepare(
    sqlClient,
    `SELECT
        e.*
      FROM deployment d
      JOIN environment e on d.environment = e.id
      JOIN project p ON e.project = p.id
      WHERE d.id = :deployment_id
      ${ifNotAdmin(
    role,
    `AND (${inClauseOr([['p.customer', customers], ['p.id', projects]])})`,
  )}
      LIMIT 1
    `,
  );

  const rows = await query(sqlClient, prep({ deployment_id }));

  return rows ? rows[0] : null;
};

const getEnvironmentByTaskId = async (
  { id: task_id },
  args,
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
) => {
  const prep = prepare(
    sqlClient,
    `SELECT
        e.*
      FROM task t
      JOIN environment e on t.environment = e.id
      JOIN project p ON e.project = p.id
      WHERE t.id = :task_id
      ${ifNotAdmin(
    role,
    `AND (${inClauseOr([['p.customer', customers], ['p.id', projects]])})`,
  )}
      LIMIT 1
    `,
  );

  const rows = await query(sqlClient, prep({ task_id }));

  return rows ? rows[0] : null;
};

const getEnvironmentStorageByEnvironmentId = async (
  { id: eid },
  args,
  { credentials: { role } },
) => {
  if (role !== 'admin') {
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

const getEnvironmentStorageMonthByEnvironmentId = async ({ id: eid }, args) => {
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

const getEnvironmentHoursMonthByEnvironmentId = async ({ id: eid }, args) => {
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

const getEnvironmentHitsMonthByEnvironmentId = async (
  { openshiftProjectName },
  args,
) => {
  const interested_date = args.month ? new Date(args.month) : new Date();
  // This generates YYYY-MM
  const interested_year_month = `${interested_date.getFullYear()}-${(`0${interested_date.getMonth() + 1}`).slice(-2)}`;
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
                    gte: `${interested_year_month}||/M`,
                    lte: `${interested_year_month}||/M`,
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
      (e.body.error.type === 'index_not_found_exception' || e.body.error.type === 'security_exception')
    ) {
      return { total: 0 };
    }
    throw e;
  }
};

const getEnvironmentServicesByEnvironmentId = async (
  { id: eid },
  args,
  { credentials: { role } },
) => {
  const rows = await query(sqlClient, Sql.selectServicesByEnvironmentId(eid));

  return rows;
};

const getEnvironmentByOpenshiftProjectName = async (
  root,
  args,
  {
    credentials: {
      role,
      permissions: { customers, projects },
    },
  },
) => {
  const str = `
    SELECT
      e.*
    FROM
      environment e
      JOIN project p ON e.project = p.id
      JOIN customer c ON p.customer = c.id
    WHERE e.openshift_project_name = :openshift_project_name
    ${ifNotAdmin(
    role,
    `AND (${inClauseOr([['c.id', customers], ['p.id', projects]])})`,
  )}
  `;

  const prep = prepare(sqlClient, str);

  const rows = await query(sqlClient, prep(args));

  return rows[0];
};

const addOrUpdateEnvironment = async (
  root,
  { input: unformattedInput },
  {
    credentials: {
      role,
      permissions: { projects },
    },
  },
) => {
  const input = R.compose(
    R.over(R.lensProp('environmentType'), envTypeToString),
    R.over(R.lensProp('deployType'), deployTypeToString),
  )(unformattedInput);

  const pid = input.project.toString();

  if (role !== 'admin' && !R.contains(pid, projects)) {
    throw new Error('Project creation unauthorized.');
  }
  const prep = prepare(
    sqlClient,
    `
      CALL CreateOrUpdateEnvironment(
        :id,
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

const addOrUpdateEnvironmentStorage = async (
  root,
  { input },
  { credentials: { role } },
) => {
  if (role !== 'admin') {
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

// const getEnvironmentByEnvironmentStorageId = async (
//   { id: esid },
//   args,
//   { credentials: { role } },
// ) => {
//   if (role !== 'admin') {
//     throw new Error('Unauthorized');
//   }
//   const prep = prepare(
//     sqlClient,
//     `
//       SELECT e.*
//       FROM environment_storage es
//       JOIN environment e ON es.environment = e.id
//       WHERE es.id = :esid
//     `,
//   );

//   const rows = await query(sqlClient, prep({ esid }));

//   return rows ? rows[0] : null;
// };

const deleteEnvironment = async (
  root,
  {
    input,
    input: {
      project: projectName,
      name,
      execute,
    },
  },
  { credentials: { role, permissions: { customers, projects } } },
) => {
  if (role !== 'admin') {
    const prep = prepare(sqlClient, 'SELECT `id` AS `pid`, `customer` AS `cid` FROM project WHERE `name` = :name');
    const rows = await query(sqlClient, prep({ name: projectName }));

    if (
      !R.contains(R.path(['0', 'pid'], rows), projects) &&
      !R.contains(R.path(['0', 'cid'], rows), customers)
    ) {
      throw new Error('Unauthorized.');
    }
  }

  const projectId = await projectHelpers.getProjectIdByName(projectName);

  const projectRows = await query(
    sqlClient,
    projectSql.selectProject(projectId),
  );
  const project = projectRows[0];

  const environmentRows = await query(
    sqlClient,
    Sql.selectEnvironmentByNameAndProject(name, projectId),
  );
  const environment = environmentRows[0];

  if (!environment) {
    throw new Error(`Environment "${name}" does not exist in project "${projectId}"`);
  }

  if (role !== 'admin' && environment.environmentType === 'production') {
    throw new Error('Unauthorized - You may not delete a production environment');
  }

  // Deleting environment in api w/o executing the openshift remove.
  // This gets called by openshiftremove service after successful remove.
  if (role === 'admin' && execute === false) {
    const prep = prepare(sqlClient, 'CALL DeleteEnvironment(:name, :project)');
    await query(sqlClient, prep({ name, project: projectId }));

    // TODO: maybe check rows for changed result
    return 'success';
  }

  let data = {
    projectName: project.name,
    type: environment.deployType,
    forceDeleteProductionEnvironment: role === 'admin',
  };

  const meta = {
    projectName: data.projectName,
    environmentName: environment.name,
  };

  switch (environment.deployType) {
    case 'branch':
      data = {
        ...data,
        branch: name,
      };
      break;

    case 'pullrequest':
      data = {
        ...data,
        pullrequestNumber: environment.name.replace('pr-', ''),
      };
      break;

    default:
      sendToLagoonLogs('error', data.projectName, '', 'api:deleteEnvironment:error', meta,
        `*[${data.projectName}]* Unknown deploy type ${environment.deployType} \`${environment.name}\``
      );
      return `Error: unknown deploy type ${environment.deployType}`;
  }

  await createRemoveTask(data);
  sendToLagoonLogs('info', data.projectName, '', 'api:deleteEnvironment', meta,
    `*[${data.projectName}]* Deleting environment \`${environment.name}\``
  );

  return 'success';
};

const updateEnvironment = async (
  root,
  { input: unformattedInput },
  { credentials: { role } },
) => {
  const input = R.compose(
    R.over(R.lensPath(['patch', 'environmentType']), envTypeToString),
    R.over(R.lensPath(['patch', 'deployType']), deployTypeToString),
  )(unformattedInput);

  if (role !== 'admin') {
    throw new Error('Unauthorized');
  }

  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  const id = input.id;
  await query(sqlClient, Sql.updateEnvironment(input));

  const rows = await query(sqlClient, Sql.selectEnvironmentById(id));

  return R.prop(0, rows);
};

const getAllEnvironments = async (
  root,
  unformattedArgs,
  { credentials: { role } },
) => {
  const args = R.compose(R.over(R.lensProp('type'), envTypeToString))(
    unformattedArgs,
  );

  if (role !== 'admin') {
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

const deleteAllEnvironments = async (root, args, { credentials: { role } }) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  await query(sqlClient, Sql.truncateEnvironment());

  // TODO: Check rows for success
  return 'success';
};

const setEnvironmentServices = async (
  root,
  { input: { environment, services } },
  { credentials: { role, permissions: { customers, projects } } },
) => {
  if (role !== 'admin') {
    const rows = await query(
      sqlClient,
      Sql.selectPermsForEnvironment(environment),
    );

    if (
      !R.contains(R.path(['0', 'pid'], rows), projects) &&
      !R.contains(R.path(['0', 'cid'], rows), customers)
    ) {
      throw new Error('Unauthorized.');
    }
  }

  await query(sqlClient, Sql.deleteServices(environment));

  for (const service of services) {
    await query(sqlClient, Sql.insertService(environment, service));
  }

  return query(sqlClient, Sql.selectServicesByEnvironmentId(environment));
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
  getEnvironmentByDeploymentId,
  getEnvironmentByTaskId,
  getEnvironmentServicesByEnvironmentId,
  setEnvironmentServices,
  deleteEnvironment,
  getEnvironmentsByProjectId,
  updateEnvironment,
  getAllEnvironments,
  deleteAllEnvironments,
};

module.exports = Resolvers;
