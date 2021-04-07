import * as R from 'ramda';
import { ResolverFn } from '../';
import { isPatchEmpty, prepare, query } from '../../util/db';
import { validateSshKey, getSshKeyFingerprint } from '.';
import { Sql } from './sql';
const userActivityLogger = require('../../loggers/userActivityLogger');

const formatSshKey = ({ keyType, keyValue }) => `${keyType} ${keyValue}`;

const sshKeyTypeToString = R.cond([
  [R.equals('SSH_RSA'), R.always('ssh-rsa')],
  [R.equals('SSH_ED25519'), R.always('ssh-ed25519')],
  [R.T, R.identity],
]);

export const getUserSshKeys: ResolverFn = async (
  { id: userId },
  args,
  { sqlClient, hasPermission },
) => {
  await hasPermission('ssh_key', 'view:user', {
    users: [userId],
  });

  const queryString = Sql.selectSshKeysByUserId(userId);
  const rows = await query(sqlClient, queryString);
  return rows;
};

export const addSshKey: ResolverFn = async (
  root,
  {
    input: {
      id, name, keyValue, keyType: unformattedKeyType, user: userInput
    }
  },
  { sqlClient, hasPermission, models , keycloakGrant, requestHeaders },
) => {
  const keyType = sshKeyTypeToString(unformattedKeyType);
  // handle key being sent as "ssh-rsa SSHKEY foo@bar.baz" as well as just the SSHKEY
  const keyValueParts = keyValue.split(' ');
  const keyFormatted = formatSshKey({ keyType, keyValue: keyValueParts.length > 1 ? keyValueParts[1] : keyValue });

  if (!validateSshKey(keyFormatted)) {
    throw new Error('Invalid SSH key format! Please verify keyType + keyValue');
  }

  const user = await models.UserModel.loadUserByIdOrUsername({
    id: R.prop('id', userInput),
    username: R.prop('email', userInput),
  });

  await hasPermission('ssh_key', 'add', {
    users: [user.id],
  });

  const {
    info: { insertId },
  } = await query(
    sqlClient,
    Sql.insertSshKey({
      id,
      name,
      keyValue,
      keyType,
      keyFingerprint: getSshKeyFingerprint(keyFormatted),
    }),
  );
  await query(sqlClient, Sql.addSshKeyToUser({ sshKeyId: insertId, userId: user.id }));
  const rows = await query(sqlClient, Sql.selectSshKey(insertId));

  userActivityLogger.user_action(`User added ssh key '${name}'`, {
    user: keycloakGrant,
    headers: requestHeaders,
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
      patch: { name, keyType: unformattedKeyType, keyValue },
    },
  },
  { sqlClient, hasPermission, keycloakGrant, requestHeaders },
) => {
  const keyType = sshKeyTypeToString(unformattedKeyType);

  const perms = await query(sqlClient, Sql.selectUserIdsBySshKeyId(id));
  const userIds = R.map(R.prop('usid'), perms);

  await hasPermission('ssh_key', 'update', {
    users: userIds,
  });

  if (isPatchEmpty({ patch })) {
    throw new Error('Input patch requires at least 1 attribute');
  }

  let keyFingerprint = null;
  if (keyType || keyValue) {
    const keyFormatted = formatSshKey({ keyType, keyValue });

    if (!validateSshKey(keyFormatted)) {
      throw new Error(
        'Invalid SSH key format! Please verify keyType + keyValue',
      );
    }

    keyFingerprint = getSshKeyFingerprint(keyFormatted);
  }

  await query(
    sqlClient,
    Sql.updateSshKey({
      id,
      patch: {
        name, keyType, keyValue, keyFingerprint,
      },
    }),
  );
  const rows = await query(sqlClient, Sql.selectSshKey(id));

  userActivityLogger.user_action(`User updated ssh key '${id}'`, {
    user: keycloakGrant,
    headers: requestHeaders,
    payload: {
      patch
    }
  });

  return R.prop(0, rows);
};

export const deleteSshKey: ResolverFn = async (
  root,
  { input: { name } },
  { sqlClient, hasPermission, keycloakGrant, requestHeaders },
) => {
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

  const perms = await query(sqlClient, Sql.selectUserIdsBySshKeyId(R.path(['0', 'id'], skidResult)));
  const userIds = R.map(R.prop('usid'), perms);

  await hasPermission('ssh_key', 'delete', {
    users: userIds
  });

  const prep = prepare(sqlClient, 'CALL DeleteSshKey(:name)');
  await query(sqlClient, prep({ name }));

  userActivityLogger.user_action(`User deleted ssh key '${name}'`, {
    user: keycloakGrant,
    headers: requestHeaders,
    payload: {
      input: {
        name
      },
      data: {
        ssh_key_name: name,
        ssh_key_id: R.path(['0', 'id'], skidResult),
        user: userIds
      }
    }
  });

  return 'success';
};

export const deleteSshKeyById: ResolverFn = async (
  root,
  { input: { id } },
  { sqlClient, hasPermission, keycloakGrant, requestHeaders },
) => {
  const perms = await query(sqlClient, Sql.selectUserIdsBySshKeyId(id));
  const userIds = R.map(R.prop('usid'), perms);

  await hasPermission('ssh_key', 'delete', {
    users: userIds
  });

  const prep = prepare(sqlClient, 'CALL DeleteSshKeyById(:id)');
  await query(sqlClient, prep({ id }));

  userActivityLogger.user_action(`User deleted ssh key with id '${id}'`, {
    user: keycloakGrant,
    headers: requestHeaders,
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
  { sqlClient, hasPermission },
) => {
  await hasPermission('ssh_key', 'deleteAll');

  await query(sqlClient, Sql.truncateSshKey());

  // TODO: Check rows for success
  return 'success';
};

export const removeAllSshKeysFromAllUsers: ResolverFn = async (
  root,
  args,
  { sqlClient, hasPermission },
) => {
  await hasPermission('ssh_key', 'removeAll');

  await query(sqlClient, Sql.truncateUserSshKey());

  // TODO: Check rows for success
  return 'success';
};
