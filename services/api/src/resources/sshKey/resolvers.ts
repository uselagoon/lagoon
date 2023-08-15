import * as R from 'ramda';
import { ResolverFn } from '../';
import { query, isPatchEmpty } from '../../util/db';
import { validateSshKey, getSshKeyFingerprint } from '.';
import { Sql } from './sql';


const formatSshKey = ({ keyType, keyValue }) => `${keyType} ${keyValue}`;

const sshKeyTypeToString = R.cond([
  [R.equals('SSH_RSA'), R.always('ssh-rsa')],
  [R.equals('SSH_ED25519'), R.always('ssh-ed25519')],
  [R.equals('ECDSA_SHA2_NISTP256'), R.always('ecdsa-sha2-nistp256')],
  [R.equals('ECDSA_SHA2_NISTP384'), R.always('ecdsa-sha2-nistp384')],
  [R.equals('ECDSA_SHA2_NISTP521'), R.always('ecdsa-sha2-nistp521')],
  [R.T, R.identity]
]);

export const getUserSshKeys: ResolverFn = async (
  { id: userId },
  args,
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  await hasPermission('ssh_key', 'view:user', {
    users: [userId]
  });

  userActivityLogger(`User queried getUserSshKeys`, {
    project: '',
    event: 'api:getUserSshKeys',
    payload:  { input: { id: userId, args: args } },
  }, 'user_query');

  return query(sqlClientPool, Sql.selectSshKeysByUserId(userId));
};

export const addSshKey: ResolverFn = async (
  root,
  {
    input: { id, name, keyValue, keyType: unformattedKeyType, user: userInput }
  },
  { sqlClientPool, hasPermission, models, userActivityLogger }
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

  const { insertId } = await query(
    sqlClientPool,
    Sql.insertSshKey({
      id,
      name,
      keyValue,
      keyType,
      keyFingerprint: getSshKeyFingerprint(keyFormatted)
    })
  );
  await query(
    sqlClientPool,
    Sql.addSshKeyToUser({ sshKeyId: insertId, userId: user.id })
  );
  const rows = await query(sqlClientPool, Sql.selectSshKey(insertId));

  userActivityLogger(`User added ssh key '${name}'`, {
    project: '',
    event: 'api:addSshKey',
    payload: {
      input: {
        id,
        name,
        keyValue,
        keyType,
        keyFingerprint: getSshKeyFingerprint(keyFormatted)
      },
      data: {
        sshKeyId: insertId,
        user
      }
    }
  });

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
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const keyType = sshKeyTypeToString(unformattedKeyType);

  const perms = await query(sqlClientPool, Sql.selectUserIdsBySshKeyId(id));
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

  await query(
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
  const rows = await query(sqlClientPool, Sql.selectSshKey(id));

  userActivityLogger(`User updated ssh key '${id}'`, {
    project: '',
    event: 'api:updateSshKey',
    payload: {
      patch
    }
  });

  return R.prop(0, rows);
};

export const deleteSshKey: ResolverFn = async (
  root,
  { input: { name } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  // Map from sshKey name to id and throw on several error cases
  const skidResult = await query(
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

  const skid = R.path(['0', 'id'], skidResult) as number;

  const perms = await query(
    sqlClientPool,
    Sql.selectUserIdsBySshKeyId(skid)
  );
  const userIds = R.map(R.prop('usid'), perms);

  await hasPermission('ssh_key', 'delete', {
    users: userIds
  });

  let res = await query(
    sqlClientPool,
    Sql.deleteUserSshKeyByKeyId(skid)
  );
  res = await query(
    sqlClientPool,
    Sql.deleteSshKeyByKeyId(skid)
  );

  userActivityLogger(`User deleted ssh key '${name}'`, {
    project: '',
    event: 'api:deleteSshKey',
    payload: {
      input: {
        name
      },
      data: {
        ssh_key_name: name,
        ssh_key_id: skid,
        user: userIds
      }
    }
  });

  return 'success';
};

export const deleteSshKeyById: ResolverFn = async (
  root,
  { input: { id } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const perms = await query(sqlClientPool, Sql.selectUserIdsBySshKeyId(id));
  const userIds = R.map(R.prop('usid'), perms);

  await hasPermission('ssh_key', 'delete', {
    users: userIds
  });

  let res = await query(
    sqlClientPool,
    Sql.deleteUserSshKeyByKeyId(id)
  );
  res = await query(
    sqlClientPool,
    Sql.deleteSshKeyByKeyId(id)
  );

  // TODO: Check rows for success

  userActivityLogger(`User deleted ssh key with id '${id}'`, {
    project: '',
    event: 'api:deleteSshKeyById',
    payload: {
      input: {
        id
      },
      data: {
        ssh_key_id: id,
        user: userIds
      }
    }
  });

  return 'success';
};

export const deleteAllSshKeys: ResolverFn = async (
  root,
  args,
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('ssh_key', 'deleteAll');

  await query(sqlClientPool, Sql.truncateSshKey());

  // TODO: Check rows for success
  return 'success';
};

export const removeAllSshKeysFromAllUsers: ResolverFn = async (
  root,
  args,
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('ssh_key', 'removeAll');

  await query(sqlClientPool, Sql.truncateUserSshKey());

  // TODO: Check rows for success
  return 'success';
};
