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
  updateCustomer: (cred, input) => {
    const { id, patch } = input;
    const { customers } = cred.permissions;

    return knex('customer')
      .where('id', '=', id)
      .whereIn('id', customers)
      .update(patch)
      .toString();
  },
  selectCustomer: (id) => {
    return knex('customer').where('id', '=', id).toString();
  }
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

const deleteCustomer = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  const prep = prepare(sqlClient, 'CALL deleteCustomer(:name)');

  const rows = await query(sqlClient, prep(input));

  // TODO: maybe check rows for changed values
  return 'success';
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

const updateCustomer = sqlClient => async (cred, input) => {
  const { customers } = cred.permissions;
  const cid = input.id.toString();

  if (cred.role !== 'admin' && !R.contains(cid, customers)) {
    throw new Error('Unauthorized');
  }

  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  await query(sqlClient, Sql.updateCustomer(cred, input));
  const rows = await query(sqlClient, Sql.selectCustomer(cid));

  return R.prop(0, rows);
};

const Queries = {
  addCustomer,
  deleteCustomer,
  getAllCustomers,
  getCustomerByProjectId,
  updateCustomer,
};

module.exports = {
  Sql,
  Queries,
};
