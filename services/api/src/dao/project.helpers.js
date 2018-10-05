// @flow

// TEMPORARY: Don't copy this `project.helpers`, etc file naming structure.
// This is just temporarily here to avoid the problems from the circular dependency between the `project` and `user` helpers.
//
// Eventually we should move to a better folder structure and away from the DAO structure. Example folder structure: https://github.com/sysgears/apollo-universal-starter-kit/tree/e2c43fcfdad8b2a4a3ca0b491bbd1493fcaee255/packages/server/src/modules/post

const R = require('ramda');

const { query } = require('./utils');

const {
  getKeycloakUserIdByUsername,
  getUsersByCustomerId,
} = require('./user.helpers');

const KeycloakOperations = require('./project.keycloak');
const Sql = require('./project.sql');

const Helpers = {
  getProjectById: async (sqlClient /* : Object */, id /* : number */) => {
    const rows = await query(sqlClient, Sql.selectProject(id));
    return R.prop(0, rows);
  },
  getProjectIdByName: async (sqlClient /* : Object */, name /* : string */) => {
    const pidResult = await query(sqlClient, Sql.selectProjectIdByName(name));

    const amount = R.length(pidResult);
    if (amount > 1) {
      throw new Error(
        `Multiple project candidates for '${name}' (${amount} found). Do nothing.`,
      );
    }

    if (amount === 0) {
      throw new Error(`Not found: '${name}'`);
    }

    const pid = R.path(['0', 'id'], pidResult);

    return pid;
  },
  getProjectsWithoutDirectUserAccess: async (
    sqlClient /* : Object */,
    projectIds /* : Array<number> */,
    userIds /* : Array<number> */,
  ) =>
    query(
      sqlClient,
      Sql.selectProjectsWithoutDirectUserAccess(projectIds, userIds),
    ),
  getCustomerProjectsWithoutDirectUserAccess: async (
    sqlClient /* : Object */,
    customerIds /* : Array<number> */,
    userIds /* : Array<number> */,
  ) =>
    query(
      sqlClient,
      Sql.selectCustomerProjectsWithoutDirectUserAccess(customerIds, userIds),
    ),
  getProjectIdsByCustomerIds: async (
    sqlClient /* : Object */,
    customerIds /* : Array<number> */,
  ) => query(sqlClient, Sql.selectProjectIdsByCustomerIds(customerIds)),
  mapIfNoDirectProjectAccess: async (
    sqlClient /* : Object */,
    keycloakClient /* : Object */,
    projectId /* : number */,
    customerId /* : number */,
    callback /* : ({keycloakUserId: string, keycloakUsername: string, keycloakGroupId: string, keycloakGroupName: string}) => Promise<void> */,
  ) => {
    // Get the users given access to the customer
    const users = await getUsersByCustomerId(sqlClient, customerId);

    // Remove all users from the Keycloak groups that correspond to all projects
    for (const user of users) {
      // Return the project in an array if the user id does not have other access via `project_user`.
      const projectName = R.path(
        [0, 'name'],
        await Helpers.getProjectsWithoutDirectUserAccess(
          sqlClient,
          [projectId],
          [R.prop('id', user)],
        ),
      );

      const email = R.prop('email', user);
      const keycloakUserId = await getKeycloakUserIdByUsername(
        keycloakClient,
        email,
      );

      const keycloakGroupId = await KeycloakOperations.findGroupIdByName(
        keycloakClient,
        projectName,
      );

      await callback({
        keycloakUserId,
        keycloakUsername: email,
        keycloakGroupId,
        keycloakGroupName: projectName,
      });
    }
  },
};

module.exports = Helpers;
