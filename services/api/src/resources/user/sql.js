// @flow

const { knex } = require('../../util/db');

/* ::

import type {SqlObj} from '../';

*/

const Sql /* : SqlObj */ = {
  selectUser: (id /* : number */) =>
    knex('user')
      .where('id', '=', id)
      .toString(),
  selectAllUsers: () => knex('user').toString(),
  selectAllUserEmails: () =>
    knex('user')
      .select('email')
      .toString(),
  selectUserBySshKey: (
    { keyValue, keyType } /* : {
    keyValue: string,
    keyType: string,
  } */,
  ) =>
    knex('user')
      .join('user_ssh_key as usk', 'usk.usid', '=', 'user.id')
      .join('ssh_key as sk', 'sk.id', '=', 'usk.skid')
      .where('sk.key_value', keyValue)
      .andWhere('sk.key_type', keyType)
      .select('user.*')
      .toString(),
  insertUser: (
    {
      id,
      email,
      firstName,
      lastName,
      comment,
      gitlabId,
    } /* : {id: number, email: string, firstName: string, lastName: string, comment: string, gitlabId: string} */,
  ) =>
    knex('user')
      .insert({
        id,
        email,
        first_name: firstName,
        last_name: lastName,
        comment,
        gitlab_id: gitlabId,
      })
      .toString(),
  updateUser: ({ id, patch } /* : {id: number, patch: {[string]: any}} */) =>
    knex('user')
      .where('id', id)
      .update(patch)
      .toString(),
  deleteUser: ({ id } /* : {id: number} */) =>
    knex('user')
      .where('id', id)
      .del()
      .toString(),
  truncateUser: () =>
    knex('user')
      .truncate()
      .toString(),
};

module.exports = Sql;
