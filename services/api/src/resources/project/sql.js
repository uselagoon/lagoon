// @flow

const { knex } = require('../../util/db');

/* ::

import type {SqlObj} from '../';

*/

const Sql /* : SqlObj */ = {
  selectProject: (id /* : number */) =>
    knex('project')
      .where('id', id)
      .toString(),
  selectAllProjectNames: () =>
    knex('project')
      .select('name')
      .toString(),
  selectAllProjects: () =>
    knex('project')
      .toString(),
  selectProjectByName: (name /* : string */) =>
    knex('project')
      .where('name', name)
      .toString(),
  selectProjectIdByName: (name /* : string */) =>
    knex('project')
      .where('name', name)
      .select('id')
      .toString(),
  // Select projects by project ids where given user ids do not have other access via `project_user` (projects where the user loses access if they lose customer access).
  selectProjectsWithoutDirectUserAccess: (
    projectIds /* : Array<number> */,
    userIds /* : Array<number> */,
  ) =>
    knex('project as p')
      .select('p.id', 'p.name', 'cu.usid')
      // Join the rows of customer_user which match the project customer id
      .leftJoin('customer_user as cu', 'cu.cid', '=', 'p.customer')
      // Join the rows of project_user which...
      .leftJoin('project_user as pu', function onClause() {
        // ...match the project id...
        this.on('pu.pid', '=', 'p.id');
        // ...and match the user id.
        this.andOn('pu.usid', '=', 'cu.usid');
      })
      // Only return projects with an id matching one of the project ids
      .whereIn('p.id', projectIds)
      // Only return projects with a customer that one or more of the user ids has access to
      .whereIn('cu.usid', userIds)
      // Filter out projects which have a matching project_user entry (where one or more of the user ids already has direct access to the project)
      .whereNull('pu.pid')
      .toString(),
  // Select projects by customer ids where given user ids do not have other access via `project_user` (projects where the user loses access if they lose customer access).
  selectCustomerProjectsWithoutDirectUserAccess: (
    customerIds /* : Array<number> */,
    userIds /* : Array<number> */,
  ) =>
    knex('project as p')
      .select('p.id', 'p.name', 'cu.usid', 'cu.cid')
      // Join the rows of customer_user which match the project customer id
      .leftJoin('customer_user as cu', 'cu.cid', '=', 'p.customer')
      // Join the rows of project_user which...
      .leftJoin('project_user as pu', function onClause() {
        // ...match the project id...
        this.on('pu.pid', '=', 'p.id');
        // ...and match the user id.
        this.andOn('pu.usid', '=', 'cu.usid');
      })
      // Only return projects with a customer matching one of the customer ids
      .whereIn('p.customer', customerIds)
      // Only return projects with a customer that one or more of the user ids has access to
      .whereIn('cu.usid', userIds)
      // Filter out projects which have a matching project_user entry (where one or more of the user ids already has direct access to the project)
      .whereNull('pu.pid')
      .toString(),
  // Returns all users that have access to a project, either directly or indirectly (through customer).
  selectAllUsersForProjectId: (projectId /* : number */) =>
    knex('user')
      .leftJoin('project_user as pu', 'pu.usid', 'user.id')
      .leftJoin('customer_user as cu', 'cu.usid', 'user.id')
      .leftJoin('project as project_via_customer', 'cu.cid', 'project_via_customer.customer')
      .leftJoin('project as project_via_user', 'pu.pid', 'project_via_user.id')
      .distinct('user.*')
      .where('project_via_user.id', projectId)
      .orWhere('project_via_customer.id', projectId)
      .toString(),
  selectPermsForProject: (id /* : number */) =>
    knex('project')
      .select({ pid: 'id', cid: 'customer' })
      .where('id', id)
      .toString(),
  updateProject: ({ id, patch } /* : {id: number, patch: {[string]: any}} */) =>
    knex('project')
      .where('id', '=', id)
      .update(patch)
      .toString(),
  truncateProject: () =>
    knex('project')
      .truncate()
      .toString(),
};

module.exports = Sql;
