import * as R from 'ramda';
import { ResolverFn } from '../';
import { query, isPatchEmpty } from '../../util/db';
import { Sql } from './sql';
import { validateKey, generatePrivateKey as genpk } from '../../util/func';

const formatSshKey = ({ keyType, keyValue }) => `${keyType} ${keyValue}`;

export const getUserSshKeys: ResolverFn = async (
  { id: userId },
  args,
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('ssh_key', 'view:user', {
    users: [userId]
  });

  return query(sqlClientPool, Sql.selectSshKeysByUserId(userId));
};

export const addSshKey: ResolverFn = async (
  root,
  {
    input: { id, name, publicKey, keyValue, keyType, user: userInput }
  },
  { sqlClientPool, hasPermission, models, userActivityLogger }
) => {
  let keyFormatted = ""
  if (!publicKey) {
    keyType = keyType.replaceAll('_', '-').toLowerCase();
    // handle key being sent as "ssh-rsa SSHKEY foo@bar.baz" as well as just the SSHKEY
    const keyValueParts = keyValue.split(' ');
    keyFormatted = formatSshKey({
      keyType,
      keyValue: keyValueParts.length > 1 ? keyValueParts[1] : keyValue
    });
  } else {
    keyFormatted = publicKey
  }

  const pkey = new Buffer(keyFormatted).toString('base64')
  const vkey = await validateKey(pkey, "public")
  if (!vkey['sha256fingerprint']) {
    throw new Error('Invalid SSH key format! Please verify keyType + keyValue');
  }

  const user = await models.UserModel.loadUserByIdOrUsername({
    id: R.prop('id', userInput),
    email: R.prop('email', userInput)
  });

  await hasPermission('ssh_key', 'add', {
    users: [user.id]
  });

  let insertId: number;
  try {
     ({insertId} = await query(
      sqlClientPool,
      Sql.insertSshKey({
        id,
        name,
        keyValue: vkey['value'],
        keyType: vkey['type'],
        keyFingerprint: vkey['sha256fingerprint']
      })
    ));
  } catch(error) {
    if(error.text.includes("Duplicate entry")){
      throw new Error(
        `Error adding SSH key. Key already exists.`
      );
    } else {
      throw new Error(error.message);
    }
  };

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
        keyValue: vkey['value'],
        keyType: vkey['type'],
        keyFingerprint: vkey['sha256fingerprint']
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
      patch: { name, publicKey, keyType, keyValue }
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const perms = await query(sqlClientPool, Sql.selectUserIdsBySshKeyId(id));
  const userIds = R.map(R.prop('usid'), perms);

  await hasPermission('ssh_key', 'update', {
    users: userIds
  });

  if (isPatchEmpty({ patch })) {
    throw new Error('Input patch requires at least 1 attribute');
  }

  let keyFormatted = ""
  if (!publicKey) {
    keyType = keyType.replaceAll('_', '-').toLowerCase();
    // handle key being sent as "ssh-rsa SSHKEY foo@bar.baz" as well as just the SSHKEY
    const keyValueParts = keyValue.split(' ');
    keyFormatted = formatSshKey({
      keyType,
      keyValue: keyValueParts.length > 1 ? keyValueParts[1] : keyValue
    });
  } else {
    keyFormatted = publicKey
  }

  const pkey = new Buffer(keyFormatted).toString('base64')
  const vkey = await validateKey(pkey, "public")
  if (!vkey['sha256fingerprint']) {
    throw new Error(
      'Invalid SSH key format! Please verify keyType + keyValue'
    );
  }

  try {
    await query(
      sqlClientPool,
      Sql.updateSshKey({
        id,
        patch: {
          name,
          keyType: vkey['type'],
          keyValue: vkey['value'],
          keyFingerprint: vkey['sha256fingerprint']
        }
      })
    );
  } catch(error) {
    if(error.text.includes("Duplicate entry")){
      throw new Error(
        `Error updating SSH key. Key already exists.`
      );
    } else {
      throw new Error(error.message);
    }
  };

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
