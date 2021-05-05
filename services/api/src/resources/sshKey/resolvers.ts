import * as R from 'ramda';
import { ResolverFn } from '../';
import { mQuery, isPatchEmpty } from '../../util/db';
import { validateSshKey, getSshKeyFingerprint } from '.';
import { Sql } from './sql';

const formatSshKey = ({ keyType, keyValue }) => `${keyType} ${keyValue}`;

const sshKeyTypeToString = R.cond([
  [R.equals('SSH_RSA'), R.always('ssh-rsa')],
  [R.equals('SSH_ED25519'), R.always('ssh-ed25519')],
  [R.T, R.identity]
]);

export const getUserSshKeys: ResolverFn = async (
  { id: userId },
  args,
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('ssh_key', 'view:user', {
    users: [userId]
  });

  return mQuery(sqlClientPool, Sql.selectSshKeysByUserId(userId));
};

export const addSshKey: ResolverFn = async (
  root,
  {
    input: { id, name, keyValue, keyType: unformattedKeyType, user: userInput }
  },
  { sqlClientPool, hasPermission, models }
) => {
  const keyType = sshKeyTypeToString(unformattedKeyType);
  // handle key being sent as "ssh-rsa SSHKEY foo@bar.baz" as well as just the SSHKEY
  const keyValueParts = keyValue.split(' ');
  const keyFormatted = formatSshKey({
    keyType,
    keyValue: keyValueParts.length > 1 ? keyValueParts[1] : keyValue
  });

  if (!validateSshKey(keyFormatted)) {
    throw new Error('Invalid SSH key format! Please verify keyType + keyValue');
  }

  const user = await models.UserModel.loadUserByIdOrUsername({
    id: R.prop('id', userInput),
    username: R.prop('email', userInput)
  });

  await hasPermission('ssh_key', 'add', {
    users: [user.id]
  });

  const { insertId } = await mQuery(
    sqlClientPool,
    Sql.insertSshKey({
      id,
      name,
      keyValue,
      keyType,
      keyFingerprint: getSshKeyFingerprint(keyFormatted)
    })
  );
  await mQuery(
    sqlClientPool,
    Sql.addSshKeyToUser({ sshKeyId: insertId, userId: user.id })
  );
  const rows = await mQuery(sqlClientPool, Sql.selectSshKey(insertId));

  return R.prop(0, rows);
};

export const updateSshKey: ResolverFn = async (
  root,
  {
    input: {
      id,
      patch,
      patch: { name, keyType: unformattedKeyType, keyValue }
    }
  },
  { sqlClientPool, hasPermission }
) => {
  const keyType = sshKeyTypeToString(unformattedKeyType);

  const perms = await mQuery(sqlClientPool, Sql.selectUserIdsBySshKeyId(id));
  const userIds = R.map(R.prop('usid'), perms);

  await hasPermission('ssh_key', 'update', {
    users: userIds
  });

  if (isPatchEmpty({ patch })) {
    throw new Error('Input patch requires at least 1 attribute');
  }

  let keyFingerprint = null;
  if (keyType || keyValue) {
    const keyFormatted = formatSshKey({ keyType, keyValue });

    if (!validateSshKey(keyFormatted)) {
      throw new Error(
        'Invalid SSH key format! Please verify keyType + keyValue'
      );
    }

    keyFingerprint = getSshKeyFingerprint(keyFormatted);
  }

  await mQuery(
    sqlClientPool,
    Sql.updateSshKey({
      id,
      patch: {
        name,
        keyType,
        keyValue,
        keyFingerprint
      }
    })
  );
  const rows = await mQuery(sqlClientPool, Sql.selectSshKey(id));

  return R.prop(0, rows);
};

export const deleteSshKey: ResolverFn = async (
  root,
  { input: { name } },
  { sqlClientPool, hasPermission }
) => {
  // Map from sshKey name to id and throw on several error cases
  const skidResult = await mQuery(
    sqlClientPool,
    Sql.selectSshKeyIdByName(name)
  );

  const amount = R.length(skidResult);
  if (amount > 1) {
    throw new Error(
      `Multiple sshKey candidates for '${name}' (${amount} found). Do nothing.`
    );
  }

  if (amount === 0) {
    throw new Error(`Not found: '${name}'`);
  }

  const perms = await mQuery(
    sqlClientPool,
    Sql.selectUserIdsBySshKeyId(R.path(['0', 'id'], skidResult))
  );
  const userIds = R.map(R.prop('usid'), perms);

  await hasPermission('ssh_key', 'delete', {
    users: userIds
  });

  await mQuery(sqlClientPool, 'CALL DeleteSshKey(:name)', { name });

  return 'success';
};

export const deleteSshKeyById: ResolverFn = async (
  root,
  { input: { id } },
  { sqlClientPool, hasPermission }
) => {
  const perms = await mQuery(sqlClientPool, Sql.selectUserIdsBySshKeyId(id));
  const userIds = R.map(R.prop('usid'), perms);

  await hasPermission('ssh_key', 'delete', {
    users: userIds
  });

  await mQuery(sqlClientPool, 'CALL DeleteSshKeyById(:id)', { id });

  // TODO: Check rows for success
  return 'success';
};

export const deleteAllSshKeys: ResolverFn = async (
  root,
  args,
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('ssh_key', 'deleteAll');

  await mQuery(sqlClientPool, Sql.truncateSshKey());

  // TODO: Check rows for success
  return 'success';
};

export const removeAllSshKeysFromAllUsers: ResolverFn = async (
  root,
  args,
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('ssh_key', 'removeAll');

  await mQuery(sqlClientPool, Sql.truncateUserSshKey());

  // TODO: Check rows for success
  return 'success';
};
