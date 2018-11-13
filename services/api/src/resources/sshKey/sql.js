// @flow

const { knex } = require('../../util/db');

/* ::

import type {Cred, SqlObj} from '../';

*/

const Sql /* : SqlObj */ = {
  selectSshKey: (id /* : number */) =>
    knex('ssh_key')
      .where('id', '=', id)
      .toString(),
  selectSshKeyIdByName: (name /* : string */) =>
    knex('ssh_key')
      .where('name', '=', name)
      .select('id')
      .toString(),
  selectSshKeyIdsByUserId: (userId /* : number */) =>
    knex('user_ssh_key')
      .select('skid')
      .where('usid', '=', userId)
      .toString(),
  selectSshKeysByUserId: (userId /* : number */) =>
    knex('ssh_key as sk')
      .join('user_ssh_key as usk', 'sk.id', '=', 'usk.skid')
      .where('usk.usid', '=', userId)
      .toString(),
  selectAllCustomerSshKeys: (
    { credentials: { role } } /* : {credentials: Cred} */,
  ) => {
    if (role !== 'admin') {
      throw new Error('Unauthorized');
    }
    return knex('ssh_key AS sk')
      .join('user_ssh_key AS usk', 'sk.id', '=', 'usk.skid')
      .join('customer_user AS cu', 'usk.usid', '=', 'cu.usid')
      .select(knex.raw("CONCAT(sk.key_type, ' ', sk.key_value) as sshKey"))
      .toString();
  },
  selectAllProjectSshKeys: (
    { credentials: { role } } /* : {credentials: Cred} */,
  ) => {
    if (role !== 'admin') {
      throw new Error('Unauthorized');
    }
    return knex('ssh_key AS sk')
      .join('user_ssh_key AS usk', 'sk.id', '=', 'usk.skid')
      .join('project_user AS pu', 'usk.usid', '=', 'pu.usid')
      .select(knex.raw("CONCAT(sk.key_type, ' ', sk.key_value) as sshKey"))
      .toString();
  },
  insertSshKey: (
    {
      id,
      name,
      keyValue,
      keyType,
    } /* : {
    id: number,
    name: string,
    keyValue: string,
    keyType: string,
  } */,
  ) =>
    knex('ssh_key')
      .insert({
        id,
        name,
        key_value: keyValue,
        key_type: keyType,
      })
      .toString(),
  addSshKeyToUser: (
    { sshKeyId, userId } /* : {
    sshKeyId: number,
    userId: number,
  } */,
  ) =>
    knex('user_ssh_key')
      .insert({
        usid: userId,
        skid: sshKeyId,
      })
      .toString(),
  updateSshKey: (
    // Comment for formatting to format properly
    { id, patch } /* : {
    id: number,
    patch: Object,
  } */,
  ) =>
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

module.exports = Sql;
