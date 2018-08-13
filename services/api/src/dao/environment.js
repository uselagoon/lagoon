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

const Sql = {
  updateEnvironment: (cred, input) => {
    const { id, patch } = input;

    return knex('environment')
      .where('id', '=', id)
      .update(patch)
      .toString();
  },
  selectEnvironmentById: id =>
    knex('environment')
      .where('id', '=', id)
      .toString(),
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
    `SELECT
        *
      FROM environment e
      WHERE e.project = :pid
      ${args.include_deleted ? '' : 'AND deleted = "0000-00-00 00:00:00"'}
      ${args.type ? 'AND e.environment_type = :type' : ''}

    `,
  );

  const rows = await query(sqlClient, prep({ pid, type: args.type }));

  return rows;
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
    `SELECT
        *
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

  // Environment was created within the interested month
  if (created_date >= interested_month_start) {
    date_from = created_date;
  }

  // Environment was created before the interested month
  if (created_date < interested_month_start) {
    date_from = interested_month_start;
  }

  // Environment is not deleted yet or was deleted after the interested month
  if (
    deleted === '0000-00-00 00:00:00' ||
    deleted_date > interested_month_end
  ) {
    date_to = interested_month_end;
  }

  // Environment was deleted in the interested month
  if (deleted_date < interested_month_end) {
    date_to = deleted_date;
  }
  console.log({ date_from, date_to });
  const hours = Math.ceil(Math.abs(date_to - date_from) / 36e5);
  return { month, hours };
};

const getEnvironmentHitsMonthByEnvironmentId = ({ esClient }) => async (
  cred,
  openshift_projectname,
  args,
) => {
  const interested_month = args.month ? new Date(args.month) : new Date();
  const month_leading_zero =
    interested_month.getMonth() + 1 < 10
      ? `0${interested_month.getMonth() + 1}`
      : interested_month.getMonth() + 1;

  try {
    const result = await esClient.count({
      index: `router-logs-${openshift_projectname}-${interested_month.getFullYear()}.${month_leading_zero}`,
      body: {
        query: {
          bool: {
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
      FROM environment e
        JOIN project p ON e.project = p.id
        JOIN customer c ON p.customer = c.id
      WHERE e.openshift_projectname = :openshiftProjectName
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
    `CALL CreateOrUpdateEnvironment(
        :name,
        :project,
        :deploy_type,
        :environment_type,
        :openshift_projectname
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
    `CALL CreateOrUpdateEnvironmentStorage(
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
    `SELECT
        e.*
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
    args.createdAfter ? 'created >= :createdAfter' : '',
    'deleted = "0000-00-00 00:00:00"',
  ]);

  const prep = prepare(sqlClient, `SELECT * FROM environment ${where}`);
  const rows = await query(sqlClient, prep(args));
  return rows;
};

const Queries = {
  addOrUpdateEnvironment,
  addOrUpdateEnvironmentStorage,
  getEnvironmentByOpenshiftProjectName,
  getEnvironmentHoursMonthByEnvironmentId,
  getEnvironmentStorageByEnvironmentId,
  getEnvironmentStorageMonthByEnvironmentId,
  getEnvironmentHitsMonthByEnvironmentId,
  getEnvironmentByEnvironmentStorageId,
  deleteEnvironment,
  getEnvironmentsByProjectId,
  updateEnvironment,
  getAllEnvironments,
};

module.exports = {
  Sql,
  Queries,
};
