// @flow

const R = require('ramda');
const sshpk = require('sshpk');
const {
  isPatchEmpty, knex, prepare, query,
} = require('./utils');

const formatSshKey = ({ keyType, keyValue }) => `${keyType} ${keyValue}`;

const validateSshKey = (key /* : string */) /* : boolean */ => {
  // Validate the format of the ssh key. This fails with an exception
  // if the key is invalid. We are not actually interested in the
  // result of the parsing and just use this for validation.
  try {
    sshpk.parseKey(key, 'ssh');
    return true;
  } catch (e) {
    return false;
  }
};

const Sql = {
  selectSshKey: id =>
    knex('ssh_key')
      .where('id', '=', id)
      .toString(),
  selectSshKeyIdByName: name =>
    knex('ssh_key')
      .where('name', '=', name)
      .select('id')
      .toString(),
  selectSshKeyIdsByUserId: userId =>
    knex('user_ssh_key')
      .select('skid')
      .where('usid', userId),
  selectAllCustomerSshKeys: (cred) => {
    if (cred.role !== 'admin') {
      throw new Error('Unauthorized');
    }
    return knex('ssh_key AS sk')
      .join('user_ssh_key AS usk', 'sk.id', '=', 'usk.skid')
      .join('customer_user AS cu', 'usk.usid', '=', 'cu.usid')
      .select(knex.raw("CONCAT(sk.key_type, ' ', sk.key_value) as sshKey"))
      .toString();
  },
  insertSshKey: ({
    id, name, keyValue, keyType,
  }) =>
    knex('ssh_key')
      .insert({
        id,
        name,
        key_value: keyValue,
        key_type: keyType,
      })
      .toString(),
  addSshKeyToUser: ({ sshKeyId, userId }) =>
    knex('user_ssh_key')
      .insert({
        usid: userId,
        skid: sshKeyId,
      })
      .toString(),
  updateSshKey: ({ id, patch }) =>
    knex('ssh_key')
      .where('id', '=', id)
      .update(patch)
      .toString(),
};

const getCustomerSshKeys = ({ sqlClient }) => async (cred) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  const rows = await query(sqlClient, Sql.selectAllCustomerSshKeys(cred));
  return R.map(R.prop('sshKey'), rows);
};

const addSshKey = ({ sqlClient }) => async (
  { role, userId: credentialsUserId },
  {
    id, name, keyValue, keyType, userId,
  },
) => {
  if (!validateSshKey(formatSshKey({ keyType, keyValue }))) {
    throw new Error('Invalid SSH key format! Please verify keyType + keyValue');
  }

  if (role !== 'admin' && !R.equals(credentialsUserId, userId)) {
    throw new Error('Unauthorized.');
  }

  await query(
    sqlClient,
    Sql.insertSshKey({
      id,
      name,
      keyValue,
      keyType,
    }),
  );
  await query(sqlClient, Sql.addSshKeyToUser({ sshKeyId: id, userId }));
  const rows = await query(sqlClient, Sql.selectSshKey(id));

  return R.prop(0, rows);
};

const updateSshKey = ({ sqlClient }) => async (
  { role, userId },
  { id, patch, patch: { name, keyType, keyValue } },
) => {
  if (role !== 'admin') {
    const rows = await query(sqlClient, Sql.selectSshKeyIdsByUserId(userId));
    const sshKeyIds = R.map(R.prop('id'), rows);
    if (!R.contains(id, sshKeyIds)) {
      throw new Error('Unauthorized.');
    }
  }

  if (isPatchEmpty({ patch })) {
    throw new Error('Input patch requires at least 1 attribute');
  }

  if (
    (keyType || keyValue) &&
    !validateSshKey(formatSshKey({ keyType, keyValue }))
  ) {
    throw new Error('Invalid SSH key format! Please verify keyType + keyValue');
  }

  await query(
    sqlClient,
    Sql.updateSshKey({ id, patch: { name, keyType, keyValue } }),
  );
  const rows = await query(sqlClient, Sql.selectSshKey(id));

  return R.prop(0, rows);
};

const deleteSshKey = ({ sqlClient }) => async ({ role, userId }, input) => {
  if (role !== 'admin') {
    const { name } = input;

    // Map from sshKey name to id and throw on several error cases
    const skidResult = await query(sqlClient, Sql.selectSshKeyIdByName(name));

    const amount = R.length(skidResult);
    if (amount > 1) {
      throw new Error(
        `Multiple sshKey candidates for '${name}' (${amount} found). Do nothing.`,
      );
    }

    if (amount === 0) {
      throw new Error(`Not found: '${name}'`);
    }

    const skid = R.path(['0', 'id'], skidResult);

    const rows = await query(sqlClient, Sql.selectSshKeyIdsByUserId(userId));
    const sshKeyIds = R.map(R.prop('id'), rows);
    if (!R.contains(skid, sshKeyIds)) {
      throw new Error('Unauthorized.');
    }
  }

  const prep = prepare(sqlClient, 'CALL DeleteSshKey(:name)');
  await query(sqlClient, prep(input));

  return 'success';
};

module.exports = {
  Sql,
  Queries: {
    getCustomerSshKeys,
    addSshKey,
    updateSshKey,
    deleteSshKey,
  },
  validateSshKey,
};
