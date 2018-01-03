// ATTENTION:
// The `sqlClient` part is usually curried in our application

// A WORD ABOUT DB SECURITY:
// ---
// We are heavily relying on building manual SQL strings,
// so of course, there is a certain risk of SQL injections.
// We try to tackle this issue by using prepared statements and
// input validation via GraphQL schema.
//
// So whenever you are writing new functions, ask yourself:
// - Am I passing in unvalidated input?
// - Is the user capable of injecting sql code via the cred object?
// - Even as an api developer, is it possible to pass in malicious SQL code?
//
// We will progressively iterate on security here, there are multiple
// ways to make this module more secure, e.g.:
// - Create higher order validation functions for args / cred and
//   apply those to the later exported daoFns
// - Use a sql-string builder, additionally with our prepared statements

const R = require('ramda');

// Useful for creating extra if-conditions for non-admins
const ifNotAdmin = (role, str) =>
  R.ifElse(R.equals('admin'), R.always(''), R.always(str))(role);

// Creates a WHERE statement with AND inbetween non-empty conditions
const whereAnd = whereConds =>
  R.compose(
    R.reduce((ret, str) => {
      if (ret === '') {
        return `WHERE ${str}`;
      } else {
        return `${ret} AND ${str}`;
      }
    }, ''),
    R.filter(R.compose(R.not, R.isEmpty)),
  )(whereConds);

// Creates an IN clause like this: $field IN (val1,val2,val3)
// or on empty values: $field IN (NULL)
const inClause = (field, values) =>
  R.compose(
    str => `${field} IN (${str})`,
    R.ifElse(R.isEmpty, R.always('NULL'), R.identity),
    R.join(','),
    R.defaultTo([]),
  )(values);

const inClauseOr = conds =>
  R.compose(
    R.reduce((ret, str) => {
      if (ret === '') {
        return str;
      } else {
        return `${ret} OR ${str}`;
      }
    }, ''),
    R.map(([field, values]) => inClause(field, values)),
  )(conds);

// Promise wrapper for doing sql queries
const query = (sqlClient, sql) =>
  new Promise((res, rej) => {
    sqlClient.query(sql, (err, rows) => {
      if (err) {
        rej(err);
      }
      res(rows);
    });
    setTimeout(() => {
      rej('Timeout while talking to the Database');
    }, 2000);
  });

// We use this just for consistency of the api calls
const prepare = (sqlClient, sql) => sqlClient.prepare(sql);

const getPermissions = sqlClient => async args => {
  const prep = prepare(
    sqlClient,
    'SELECT projects, customers FROM permission WHERE sshKey = :sshKey',
  );

  const rows = await query(sqlClient, prep(args));

  return R.propOr(null, 0, rows);
};

const getCustomerSshKeys = sqlClient => async cred => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const rows = await query(
    sqlClient,
    `SELECT CONCAT(sk.keyType, ' ', sk.keyValue) as sshKey
       FROM ssh_key sk, customer c, customer_ssh_key csk
       WHERE csk.cid = c.id AND csk.skid = sk.id`,
  );

  return R.map(R.prop('sshKey'), rows);
};

const getAllCustomers = sqlClient => async (cred, args) => {
  const where = whereAnd([
    args.createdAfter ? 'created >= :createdAfter' : '',
    ifNotAdmin(cred.role, `${inClause('id', cred.permissions.customers)}`),
  ]);
  const prep = prepare(sqlClient, `SELECT * FROM customer ${where}`);
  const rows = await query(sqlClient, prep(args));
  return rows;
};

const getAllOpenshifts = sqlClient => async (cred, args) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const { createdAfter } = args;
  const prep = prepare(sqlClient, 'SELECT * FROM openshift');
  const rows = await query(sqlClient, prep(args));

  return rows;
};

const getAllProjects = sqlClient => async (cred, args) => {
  const { customers, projects } = cred.permissions;

  // We need one "WHERE" keyword, but we have multiple optional conditions
  const where = whereAnd([
    args.createdAfter ? 'created >= :createdAfter' : '',
    args.gitUrl ? 'git_url = :gitUrl' : '',
    ifNotAdmin(
      cred.role,
      inClauseOr([['customer', customers], ['project.id', projects]]),
    ),
  ]);

  const prep = prepare(sqlClient, `SELECT * FROM project ${where}`);
  const rows = await query(sqlClient, prep(args));

  return rows;
};

const getOpenshiftByProjectId = sqlClient => async (cred, pid) => {
  const { customers, projects } = cred.permissions;

  const prep = prepare(
    sqlClient,
    `SELECT
        o.*
      FROM project p
      JOIN openshift o ON o.id = p.openshift
      WHERE p.id = :pid
      ${ifNotAdmin(
        cred.role,
        `AND ${inClauseOr([['p.customer', customers], ['p.id', projects]])}`,
      )}
    `,
  );

  const rows = await query(sqlClient, prep({ pid }));

  return rows ? rows[0] : null;
};

const getNotificationsByProjectId = sqlClient => async (cred, pid, args) => {
  const { customers, projects } = cred.permissions;
  const prep = prepare(
    sqlClient,
    `SELECT
        ns.id,
        ns.name,
        ns.webhook,
        ns.channel,
        pn.type
      FROM project_notification pn
      JOIN project p ON p.id = pn.pid
      JOIN notification_slack ns ON pn.nid = ns.id
      WHERE
        pn.pid = :pid
        ${args.type ? 'AND pn.type = :type' : ''}
        ${ifNotAdmin(
          cred.role,
          `AND (${inClauseOr([
            ['p.customer', customers],
            ['p.id', projects],
          ])})`,
        )}
    `,
  );

  const rows = await query(
    sqlClient,
    prep({
      pid: pid,
      type: args.type,
    }),
  );

  return rows ? rows : null;
};

const getSshKeysByProjectId = sqlClient => async (cred, pid) => {
  const { customers, projects } = cred.permissions;
  const prep = prepare(
    sqlClient,
    `SELECT
      sk.id,
      sk.name,
      sk.keyValue,
      sk.keyType,
      sk.created
    FROM project_ssh_key ps
    JOIN ssh_key sk ON ps.skid = sk.id
    JOIN project p ON ps.pid = p.id
    WHERE ps.pid = :pid
      ${ifNotAdmin(
        cred.role,
        `AND (${inClauseOr([['p.customer', customers], ['p.id', projects]])})`,
      )}
    `
  );

  const rows = await query(sqlClient, prep({ pid }));

  return rows ? rows : null;
};

const getEnvironmentsByProjectId = sqlClient => async (cred, pid) => {
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
    `,
  );

  const rows = await query(sqlClient, prep({ pid }));

  return rows;
};

const getSshKeysByCustomerId = sqlClient => async (cred, cid) => {
  const { customers } = cred.permissions;

  const prep = sqlClient.prepare(`
      SELECT
        id,
        name,
        keyValue,
        keyType,
        created
      FROM customer_ssh_key cs
      JOIN ssh_key sk ON cs.skid = sk.id
      WHERE cs.cid = :cid
      ${ifNotAdmin(cred.role, `AND ${inClause('cs.cid', customers)}`)}
    `);

  const rows = await query(sqlClient, prep({ cid }));

  return rows;
};

const getCustomerByProjectId = sqlClient => async (cred, pid) => {
  const { customers, projects } = cred.permissions;
  const str = `
      SELECT
        c.id,
        c.name,
        c.comment,
        c.private_key,
        c.created
      FROM project p
      JOIN customer c ON p.customer = c.id
      WHERE p.id = :pid
      ${ifNotAdmin(
        cred.role,
        `AND (${inClauseOr([['c.id', customers], ['p.id', projects]])})`,
      )}
    `;
  const prep = prepare(sqlClient, str);

  const rows = await query(sqlClient, prep({ pid }));

  return rows ? rows[0] : null;
};

const getProjectByEnvironmentId = sqlClient => async (cred, eid) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  const prep = prepare(
    sqlClient,
    `SELECT
        p.*
      FROM environment e
      JOIN project p ON e.project = p.id
      WHERE e.id = :eid
    `,
  );

  const rows = await query(sqlClient, prep({ eid }));

  return rows ? rows[0] : null;
};

const getProjectByGitUrl = sqlClient => async (cred, args) => {
  const { customers, projects } = cred.permissions;
  const str = `
      SELECT
        *
      FROM project
      WHERE git_url = :gitUrl
      ${ifNotAdmin(
        cred.role,
        `AND (${inClauseOr([
          ['customer', customers],
          ['project.id', projects],
        ])})`,
      )}
      LIMIT 1
    `;

  const prep = prepare(sqlClient, str);
  const rows = await query(sqlClient, prep(args));

  return rows ? rows[0] : null;
};

const getProjectByName = sqlClient => async (cred, args) => {
  const { customers, projects } = cred.permissions;
  const str = `
      SELECT
        *
      FROM project
      WHERE name = :name
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

const addProject = sqlClient => async (cred, input) => {
  const { customers } = cred.permissions;
  const cid = input.customer.toString();

  if (cred.role !== 'admin' && !R.contains(cid, customers)) {
    throw new Error('Project creation unauthorized.');
  }

  const prep = prepare(
    sqlClient,
    `CALL CreateProject(
        :id,
        :name,
        :customer,
        :git_url,
        :openshift,
        ${
          input.active_systems_deploy
            ? ':active_systems_deploy'
            : '"lagoon_openshiftBuildDeploy"'
        },
        ${
          input.active_systems_remove
            ? ':active_systems_remove'
            : '"lagoon_openshiftRemove"'
        },
        ${input.branches ? ':branches' : '"true"'},
        ${
          input.pullrequests
            ? "IF(STRCMP(:pullrequests, 'true'), 1, 0)"
            : 'NULL'
        },
        ${input.production_environment ? ':production_environment' : 'NULL'}
      );
    `,
  );

  const rows = await query(sqlClient, prep(input));
  const project = R.path([0, 0], rows);

  return project;
};

const deleteProject = sqlClient => async (cred, input) => {
  const { projects } = cred.permissions;
  const pid = input.id.toString();

  if (cred.role !== 'admin' && !R.contains(pid, projects)) {
    throw new Error('Unauthorized');
  }

  const prep = prepare(sqlClient, 'CALL DeleteProject(:id)');
  const rows = await query(sqlClient, prep(input));

  return 'success';
};

const addSshKey = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Project creation unauthorized.');
  }

  const prep = prepare(
    sqlClient,
    `CALL CreateSshKey(
        :id,
        :name,
        :keyValue,
        ${input.keyType ? ':keyType' : 'ssh-rsa'}
      );
    `,
  );
  const rows = await query(sqlClient, prep(input));

  const ssh_key = R.path([0, 0], rows);
  return ssh_key;
};

const deleteSshKey = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const prep = prepare(sqlClient, 'CALL DeleteSshKey(:name)');
  const rows = await query(sqlClient, prep(input));

  //TODO: maybe check rows for any changed rows?
  return 'success';
};

const addCustomer = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Project creation unauthorized.');
  }

  const prep = prepare(
    sqlClient,
    `CALL CreateCustomer(
        :id,
        :name,
        ${input.comment ? ':comment' : 'NULL'},
        ${input.private_key ? ':private_key' : 'NULL'}
      );
    `,
  );
  const rows = await query(sqlClient, prep(input));
  const customer = R.path([0, 0], rows);

  return customer;
};

const deleteCustomer = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  const prep = prepare(sqlClient, 'CALL deleteCustomer(:name)');

  const rows = await query(sqlClient, prep(input));

  // TODO: maybe check rows for changed values
  return 'success';
};

const addOpenshift = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Project creation unauthorized.');
  }
  const prep = prepare(
    sqlClient,
    `CALL CreateOpenshift(
        :id,
        :name,
        :console_url,
        ${input.token ? ':token' : 'NULL'},
        ${input.router_pattern ? ':router_pattern' : 'NULL'},
        ${input.project_user ? ':project_user' : 'NULL'},
        ${input.ssh_host ? ':ssh_host' : 'NULL'},
        ${input.ssh_port ? ':ssh_port' : 'NULL'}
      );
    `,
  );

  const rows = await query(sqlClient, prep(input));
  const openshift = R.path([0, 0], rows);

  return openshift;
};

const addOrUpdateEnvironment = sqlClient => async (cred, input) => {
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
        :git_type,
        :environment_type,
        :openshift_projectname
      );
    `,
  );

  const rows = await query(sqlClient, prep(input));
  const environment = R.path([0, 0], rows);

  return environment;
};

const deleteEnvironment = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const prep = prepare(sqlClient, 'CALL DeleteEnvironment(:name, :project)');
  const rows = await query(sqlClient, prep(input));

  // TODO: maybe check rows for changed result
  return 'success';
};

const deleteOpenshift = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const prep = prepare(sqlClient, 'CALL deleteOpenshift(:name)');
  const rows = await query(sqlClient, prep(input));

  // TODO: maybe check rows for changed result
  return 'success';
};

const addNotificationSlack = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Project creation unauthorized.');
  }

  const prep = prepare(
    sqlClient,
    'CALL CreateNotificationSlack(:name, :webhook, :channel)',
  );

  const rows = await query(sqlClient, prep(input));
  const slack = R.path([0, 0], rows);

  return slack;
};

const deleteNotificationSlack = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Project creation unauthorized.');
  }

  const prep = prepare(sqlClient, 'CALL DeleteNotificationSlack(:name)');
  const rows = await query(sqlClient, prep(input));

  // TODO: maybe check rows for changed result
  return 'success';
};

const addNotificationToProject = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Project creation unauthorized.');
  }

  const prep = prepare(
    sqlClient,
    'CALL CreateProjectNotification(:project, :notificationType, :notificationName)',
  );
  const rows = await query(sqlClient, prep(input));
  const project = R.path([0, 0], rows);

  return project;
};

const removeNotificationFromProject = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('unauthorized.');
  }
  const prep = prepare(
    sqlClient,
    'CALL DeleteProjectNotification(:project, :notificationType, :notificationName)',
  );
  const rows = await query(sqlClient, prep(input));
  const project = R.path([0, 0], rows);

  return project;
};

const addSshKeyToProject = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('unauthorized.');
  }

  const prep = prepare(
    sqlClient,
    'CALL CreateProjectSshKey(:project, :sshKey)',
  );
  const rows = await query(sqlClient, prep(input));
  const project = R.path([0, 0], rows);

  return project;
};

const removeSshKeyFromProject = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('unauthorized.');
  }

  const prep = prepare(
    sqlClient,
    'CALL DeleteProjectSshKey(:project, :sshKey)',
  );
  const rows = await query(sqlClient, prep(input));
  const project = R.path([0, 0], rows);

  return project;
};

const addSshKeyToCustomer = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('unauthorized.');
  }

  const prep = prepare(
    sqlClient,
    'CALL CreateCustomerSshKey(:customer, :sshKey)',
  );
  const rows = await query(sqlClient, prep(input));
  const customer = R.path([0, 0], rows);

  return customer;
};

const removeSshKeyFromCustomer = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  const prep = prepare(
    sqlClient,
    'CALL DeleteCustomerSshKey(:customer, :sshKey)',
  );
  const rows = await query(sqlClient, prep(input));
  const customer = R.path([0, 0], rows);

  return customer;
};

const truncateTable = sqlClient => async (cred, args) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const { tableName } = args;

  const prep = prepare(sqlClient, `TRUNCATE table \`${tableName}\``);

  const rows = await query(sqlClient, prep(args));

  // TODO: eventually check rows for success
  return 'success';
};

const daoFns = {
  getPermissions,
  getCustomerSshKeys,
  getAllCustomers,
  getAllOpenshifts,
  getOpenshiftByProjectId,
  getProjectByEnvironmentId,
  getEnvironmentsByProjectId,
  getProjectByGitUrl,
  getNotificationsByProjectId,
  getSshKeysByProjectId,
  getSshKeysByCustomerId,
  getCustomerByProjectId,
  getProjectByName,
  getAllProjects,
  addProject,
  deleteProject,
  addSshKey,
  deleteSshKey,
  addCustomer,
  deleteCustomer,
  addOpenshift,
  deleteOpenshift,
  addNotificationSlack,
  deleteNotificationSlack,
  addNotificationToProject,
  removeNotificationFromProject,
  addSshKeyToProject,
  removeSshKeyFromProject,
  addSshKeyToCustomer,
  removeSshKeyFromCustomer,
  addOrUpdateEnvironment,
  deleteEnvironment,
  truncateTable,
};

// Maps all dao functions to given sqlClient
// "make" is the FP equivalent of `new Dao()` in OOP
// sqlClient: the mariadb client instance provided by the node-mariadb module
const make = sqlClient => R.mapObjIndexed((fn, name) => fn(sqlClient), daoFns);

module.exports = {
  ...daoFns,
  make,
  ifNotAdmin,
  whereAnd,
  inClause,
  inClauseOr,
};
