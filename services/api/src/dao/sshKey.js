const R = require('ramda');
const {
  ifNotAdmin,
  inClause,
  inClauseOr,
  isPatchEmpty,
  knex,
  prepare,
  query,
  whereAnd,
} = require('./utils');

const Sql = {
  updateSshKey: (cred, input) => {
    const { id, patch } = input;

    return knex('ssh_key')
      .where('id', '=', id)
      .update(patch)
      .toString();
  },
  selectSshKey: id =>
    knex('ssh_key')
      .where('id', '=', id)
      .toString(),
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
    `,
  );

  const rows = await query(sqlClient, prep({ pid }));

  return rows ? rows : null;
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

const deleteSshKey = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const prep = prepare(sqlClient, 'CALL DeleteSshKey(:name)');
  const rows = await query(sqlClient, prep(input));

  //TODO: maybe check rows for any changed rows?
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

const addSshKeyToProject = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized.');
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
    throw new Error('Unauthorized.');
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

const updateSshKey = sqlClient => async (cred, input) => {
  const sshKeyId = R.path(['permissions', 'sshKeyId'], cred);
  const skid = input.id.toString();

  if (cred.role !== 'admin' && !R.equals(sshKeyId, skid)) {
    throw new Error('Unauthorized.');
  }

  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  await query(sqlClient, Sql.updateSshKey(cred, input));
  const rows = await query(sqlClient, Sql.selectSshKey(skid));

  return R.prop(0, rows);
};

const Queries = {
  addSshKey,
  addSshKeyToCustomer,
  addSshKeyToProject,
  deleteSshKey,
  getCustomerSshKeys,
  getSshKeysByCustomerId,
  getSshKeysByProjectId,
  removeSshKeyFromCustomer,
  removeSshKeyFromProject,
  updateSshKey,
};

module.exports = {
  Sql,
  Queries,
};
