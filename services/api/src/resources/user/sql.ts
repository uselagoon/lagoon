import { update } from 'ramda';
import { knex } from '../../util/db';

export const Sql = {
  selectUserById: (id: string) =>
    knex('user')
      .select('usid', 'opt_email_org_role', 'opt_email_sshkey', 'opt_email_group_role', 'last_accessed')
      .where('usid', id)
      .toString(),
  selectUserIdBySshKey: ({
    keyValue,
    keyType,
  }: {
    keyValue: string;
    keyType: string;
    }): string =>
    knex('user_ssh_key')
      .join('ssh_key as sk', 'sk.id', '=', 'user_ssh_key.skid')
      .where('sk.key_value', keyValue)
      .andWhere('sk.key_type', keyType)
      .select('user_ssh_key.usid')
      .toString(),
  deleteFromSshKeys: (id: string) =>
    knex('ssh_key')
      .whereIn('id', function() {
        this.select('skid')
            .from('user_ssh_key')
            .where('usid', id);
      })
      .delete()
      .toString(),
  deleteFromUserSshKeys: (id: string) =>
    knex('user_ssh_key')
      .where('usid', id)
      .delete()
      .toString(),
  selectUserIdBySshFingerprint: ({
    keyFingerprint,
  }: {
    keyFingerprint: string;
    }): string =>
    knex('user_ssh_key')
      .join('ssh_key as sk', 'sk.id', '=', 'user_ssh_key.skid')
      .where('sk.key_fingerprint', keyFingerprint)
      .select('user_ssh_key.usid')
      .toString(),
  updateLastAccessed: (id: string) =>
    knex('user')
      .insert({
        usid: id,
        lastAccessed: knex.fn.now(),
      })
      .onConflict('usid')
      .merge()
      .toString(),
  updateUserDBTable: (id: string, data: Record<string, any>) =>
    knex('user')
      .insert({usid: id, ...data})
      .onConflict('usid')
      .merge({...data})
      .toString(),
  selectLastAccessed: (id: string) =>
    knex('user')
      .select('last_accessed')
      .where('usid','=',id)
      .toString(),
  deleteFromUser: (id: string) =>
    knex('user')
      .where('usid', id)
      .delete()
      .toString(),
};
