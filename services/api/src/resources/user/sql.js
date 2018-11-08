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
  selectUsersByProjectId: ({ projectId } /* : { projectId: number } */) =>
    knex('user')
      .join('project_user as pu', 'pu.usid', '=', 'user.id')
      .join('user_ssh_key as usk', 'usk.usid', '=', 'user.id')
      .join('ssh_key as sk', 'sk.id', '=', 'usk.skid')
      .select(
        'user.id',
        'user.email',
        'user.first_name',
        'user.last_name',
        'user.comment',
        'user.gitlab_id',
        'sk.id as ssh_key_id',
        'sk.name as ssh_key_name',
        'sk.key_value as ssh_key_value',
        'sk.key_type as ssh_key_type',
        'sk.created as ssh_key_created',
      )
      .where('pu.pid', projectId)
      .toString(),
  selectUsersByCustomerId: ({ customerId } /* : { customerId: number } */) =>
    knex('user')
      .join('customer_user as cu', 'cu.usid', '=', 'user.id')
      .join('user_ssh_key as usk', 'usk.usid', '=', 'user.id')
      .join('ssh_key as sk', 'sk.id', '=', 'usk.skid')
      .select(
        'user.id',
        'user.email',
        'user.first_name',
        'user.last_name',
        'user.comment',
        'user.gitlab_id',
        'sk.id as ssh_key_id',
        'sk.name as ssh_key_name',
        'sk.key_value as ssh_key_value',
        'sk.key_type as ssh_key_type',
        'sk.created as ssh_key_created',
      )
      .where('cu.cid', customerId)
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
  addUserToProject: (
    { projectId, userId } /* : {projectId: number, userId: number} */,
  ) =>
    knex('project_user')
      .insert({
        usid: userId,
        pid: projectId,
      })
      .toString(),
  removeUserFromProject: (
    { projectId, userId } /* : {projectId: number, userId: number} */,
  ) =>
    knex('project_user')
      .where('pid', projectId)
      .andWhere('usid', userId)
      .del()
      .toString(),
  removeUserFromAllProjects: ({ id } /* : {id: number} */) =>
    knex('project_user')
      .where('usid', id)
      .del()
      .toString(),
  addUserToCustomer: (
    { customerId, userId } /* : {customerId: number, userId: number} */,
  ) =>
    knex('customer_user')
      .insert({
        usid: userId,
        cid: customerId,
      })
      .toString(),
  removeUserFromCustomer: (
    { customerId, userId } /* : {customerId: number, userId: number} */,
  ) =>
    knex('customer_user')
      .where('cid', customerId)
      .andWhere('usid', userId)
      .del()
      .toString(),
  removeUserFromAllCustomers: ({ id } /* : {id: number} */) =>
    knex('customer_user')
      .where('usid', id)
      .del()
      .toString(),
  truncateUser: () =>
    knex('user')
      .truncate()
      .toString(),
  truncateCustomerUser: () =>
    knex('customer_user')
      .truncate()
      .toString(),
  truncateProjectUser: () =>
    knex('project_user')
      .truncate()
      .toString(),
};

module.exports = Sql;
