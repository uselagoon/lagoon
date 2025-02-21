import * as R from 'ramda';
import { ResolverFn } from '../';
import { query, isPatchEmpty } from '../../util/db';
import { Sql } from './sql';
import { validateKey, generatePrivateKey as genpk } from '../../util/func';
import { AuditType } from '@lagoon/commons/dist/types';
import { AuditLog } from '../audit/types';

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
  const user = await models.UserModel.loadUserByIdOrEmail({
    id: R.prop('id', userInput),
    email: R.prop('email', userInput)
  });

  await hasPermission('ssh_key', 'add', {
    users: [user.id]
  });

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

  const vkey = await validateKey(keyFormatted, "public")
  if (!vkey['sha256fingerprint']) {
    throw new Error('Invalid SSH key format! Please verify keyType + keyValue');
  }

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

  const auditLog: AuditLog = {
    resource: {
      id: user.id,
      type: AuditType.USER,
      details: user.email,
    },
    linkedResource: {
      id: id,
      type: AuditType.SSHKEY,
      details: vkey['sha256fingerprint']
    },
  };
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
      },
      ...auditLog,
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
  { sqlClientPool, hasPermission, models, userActivityLogger }
) => {
  const perms = await query(sqlClientPool, Sql.selectUserIdsBySshKeyId(id));
  const userIds = R.map(R.prop('usid'), perms);

  await hasPermission('ssh_key', 'update', {
    users: userIds
  });

  const user = await models.UserModel.loadUserByIdOrEmail({
    id: userIds[0],
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

  const vkey = await validateKey(keyFormatted, "public")
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

  const auditLog: AuditLog = {
    resource: {
      id: user.id,
      type: AuditType.USER,
      details: user.email,
    },
    linkedResource: {
      id: id,
      type: AuditType.SSHKEY,
      details: vkey['sha256fingerprint']
    },
  };
  userActivityLogger(`User updated ssh key '${id}'`, {
    project: '',
    event: 'api:updateSshKey',
    payload: {
      patch,
      ...auditLog,
    }
  });

  return R.prop(0, rows);
};

export const deleteSshKey: ResolverFn = async (
  root,
  { input: { name } },
  { sqlClientPool, hasPermission, models, userActivityLogger }
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

  const user = await models.UserModel.loadUserByIdOrEmail({
    id: userIds[0],
  });

  let res = await query(
    sqlClientPool,
    Sql.deleteUserSshKeyByKeyId(skid)
  );
  res = await query(
    sqlClientPool,
    Sql.deleteSshKeyByKeyId(skid)
  );

  const auditLog: AuditLog = {
    resource: {
      id: user.id,
      type: AuditType.USER,
      details: user.email,
    },
    linkedResource: {
      id: skid.toString(),
      type: AuditType.SSHKEY,
    },
  };
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
      },
      ...auditLog,
    }
  });

  return 'success';
};

export const deleteSshKeyById: ResolverFn = async (
  root,
  { input: { id } },
  { sqlClientPool, hasPermission, models, userActivityLogger }
) => {
  const perms = await query(sqlClientPool, Sql.selectUserIdsBySshKeyId(id));
  const userIds = R.map(R.prop('usid'), perms);

  await hasPermission('ssh_key', 'delete', {
    users: userIds
  });

  const user = await models.UserModel.loadUserByIdOrEmail({
    id: userIds[0],
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

  const auditLog: AuditLog = {
    resource: {
      id: user.id,
      type: AuditType.USER,
      details: user.email,
    },
    linkedResource: {
      id: id.toString(),
      type: AuditType.SSHKEY,
    },
  };
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
      },
      ...auditLog,
    }
  });

  return 'success';
};
