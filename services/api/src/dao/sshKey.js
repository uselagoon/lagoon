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
  hasSshKeyPatch,
} = require('./utils');
const { validateSshKey } = require('@lagoon/commons/src/jwt');

const fullSshKey = ({ keyType, keyValue }) => `${keyType} ${keyValue}`;

const Sql = {
  allowedToModify: (cred, id) => {
    const { customers, projects } = cred.permissions;

    let query = knex('ssh_key AS sk')
      .join('project_ssh_key AS ps', 'sk.id', '=', 'ps.skid')
      .join('customer_ssh_key AS cs', 'sk.id', '=', 'cs.skid');

    if (cred.role != 'admin') {
      query
        .where(function() {
          this.whereIn('cs.cid', customers);
          this.orWhereIn('ps.pid', projects);
        })
        .andWhere('sk.id', '=', id);
    }

    return (
      query
        // .select('sk.id', 'ps.pid', 'cs.cid')
        .select(knex.raw('IF(COUNT(sk.id) > 0, 1, 0) as allowed'))
        .limit(1)
        .toString()
    );
  },
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
  selectSshKeyIdByName: name =>
    knex('ssh_key')
      .where('name', '=', name)
      .select('id')
      .toString(),
};

// Helper function to map the Sql.allowedToModify result to a boolean
const isModificationAllowed = async (sqlClient, cred, skid) => {
  const result = await query(sqlClient, Sql.allowedToModify(cred, skid));

  const allowed = R.pathOr('0', ['0', 'allowed'], result);
  return allowed === '1';
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
  // TODO: Fix edge-case:
  // User adds a SshKey and doesn't assign it to any project / customer the user
  // belongs to... now he / she cannot delete the key anymore and needs to assign
  // it to a proper project / customer first.
  if (cred.role !== 'admin') {
    const skidResult = await query(sqlClient, Sql.selectSshKeyIdByName(input.name))

    const amount = R.length(skidResult);
    if (amount > 1) {
      throw new Error(`Multiple candidates for '${input.name}' (${amount} found). Do nothing.`)
    }

    if (amount === 0) {
      throw new Error(`Not found: '${input.name}'`);
    }

    const skid = R.path(['0', 'id'], skidResult);

    const allowed = await isModificationAllowed(sqlClient, cred, skid);
    if (!allowed) {
      throw new Error('Unauthorized.');
    }
  }

  const prep = prepare(sqlClient, 'CALL DeleteSshKey(:name)');
  const rows = await query(sqlClient, prep(input));

  //TODO: maybe check rows for any changed rows?
  return 'success';
};

const addSshKey = sqlClient => async (cred, input) => {
  if (!validateSshKey(fullSshKey(input))) {
    throw new Error('Invalid SSH key format! Please verify keyType + keyValue');
  }

  const prep = prepare(
    sqlClient,
    `CALL CreateSshKey(
        :id,
        :name,
        :keyValue,
        :keyType
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
    const allowed = await isModificationAllowed(sqlClient, cred, skid);
    if (!allowed) {
      throw new Error('Unauthorized.');
    }
  }

  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  if (hasSshKeyPatch(input) && !validateSshKey(fullSshKey(input.patch))) {
    throw new Error('Invalid SSH key format! Please verify keyType + keyValue');
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
