import { knex } from '../../util/db';

export default {
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
};
