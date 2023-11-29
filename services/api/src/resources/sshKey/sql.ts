import { knex } from '../../util/db';

export const Sql = {
  selectSshKey: (id: number) =>
    knex('ssh_key')
      .where('id', '=', id)
      .toString(),
  selectSshKeyIdByName: (name: string) =>
    knex('ssh_key')
      .where('name', '=', name)
      .select('id')
      .toString(),
  selectSshKeyByFingerprint: (fingerprint: string) =>
    knex('ssh_key')
      .where('key_fingerprint', '=', fingerprint)
      .select('id')
      .toString(),
  selectSshKeysByUserId: (userId: number) =>
    knex('ssh_key as sk')
      .join('user_ssh_key as usk', 'sk.id', '=', 'usk.skid')
      .where('usk.usid', '=', userId)
      .toString(),
  selectUserIdsBySshKeyId: (keyId: number) =>
    knex('ssh_key as sk')
      .select('usk.usid')
      .join('user_ssh_key as usk', 'sk.id', '=', 'usk.skid')
      .where('usk.skid', '=', keyId)
      .toString(),
  selectUserIdsBySshKeyFingerprint: (fingerprint: string) =>
    knex('ssh_key as sk')
      .select('usk.usid')
      .join('user_ssh_key as usk', 'sk.id', '=', 'usk.skid')
      .where('sk.key_fingerprint', '=', fingerprint)
      .toString(),
  selectSshKeyByFingerprint: (fingerprint: string) =>
    knex('ssh_key')
      .where('key_fingerprint', '=', fingerprint)
      .toString(),
  deleteUserSshKeyByKeyId: (skid: number) =>
    knex('user_ssh_key')
      .where('skid', skid)
      .delete()
      .toString(),
  deleteSshKeyByKeyId: (skid: number) =>
    knex('ssh_key')
      .where('id', skid)
      .delete()
      .toString(),
  insertSshKey: ({
    id,
    name,
    keyValue,
    keyType,
    keyFingerprint,
  }: {
    id: number,
    name: string,
    keyValue: string,
    keyType: string,
    keyFingerprint: string,
  }) =>
    knex('ssh_key')
      .insert({
        id,
        name,
        key_value: keyValue,
        key_type: keyType,
        key_fingerprint: keyFingerprint,
      })
      .toString(),
  addSshKeyToUser: (
    { sshKeyId, userId }: { sshKeyId: number, userId: number }) =>
    knex('user_ssh_key')
      .insert({
        usid: userId,
        skid: sshKeyId,
      })
      .toString(),
  updateSshKey: (
    { id, patch }: { id: number, patch: { [key: string]: any } }) =>
    knex('ssh_key')
      .where('id', '=', id)
      .update(patch)
      .toString(),
  truncateSshKey: () =>
    knex('ssh_key')
      .truncate()
      .toString(),
  truncateUserSshKey: () =>
    knex('user_ssh_key')
      .truncate()
      .toString(),
};
