import { knex } from '../../util/db';

export const Sql = {
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
  deleteUserSshKeys: (id: string) =>
    knex('ssh_key as sk')
      .join('user_ssh_key as usk', 'sk.id', '=', 'usk.skid')
      .where('usk.usid', '=', id)
      .delete()
      .toString(),
};
