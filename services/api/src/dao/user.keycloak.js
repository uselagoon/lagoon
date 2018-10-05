// @flow

// TEMPORARY: Don't copy this `project.helpers`, etc file naming structure.
// This is just temporarily here to avoid the problems from the circular dependency between the `project` and `user` helpers.
//
// Eventually we should move to a better folder structure and away from the DAO structure. Example folder structure: https://github.com/sysgears/apollo-universal-starter-kit/tree/e2c43fcfdad8b2a4a3ca0b491bbd1493fcaee255/packages/server/src/modules/post

const R = require('ramda');
const logger = require('../logger');

const KeycloakOperations = {
  findUserIdByUsername: async (
    keycloakClient /* : Object */,
    username /* : string */,
  ) =>
    R.path(
      [0, 'id'],
      await keycloakClient.users.findOne({
        username,
      }),
    ),
  createUser: async (
    keycloakClient /* : Object */,
    payload /* :{
    username: string,
    email: string,
    firstName: string,
    lastName: string,
    enabled: boolean,
    attributes: {
      [string]: any
    },
  } */,
  ) => {
    try {
      await keycloakClient.users.create(payload);

      logger.debug(
        `Created Keycloak user with username ${R.prop('username', payload)}`,
      );
    } catch (err) {
      if (err.response.status === 409) {
        logger.warn(
          `Failed to create already existing Keycloak user "${R.prop(
            'email',
            payload,
          )}"`,
        );
      } else {
        logger.error(`Error creating Keycloak user: ${err}`);
        throw new Error(`Error creating Keycloak user: ${err}`);
      }
    }
  },
  deleteUser: async (
    keycloakClient /* : Object */,
    username /* : string */,
  ) => {
    try {
      // Find the Keycloak user id with a username matching the username
      const keycloakUserId = await KeycloakOperations.findUserIdByUsername(
        keycloakClient,
        username,
      );

      // Delete the user
      await keycloakClient.users.del({ id: keycloakUserId });

      logger.debug(`Deleted Keycloak user with username "${username}"`);
    } catch (err) {
      logger.error(`Error deleting Keycloak user: ${err}`);
      throw new Error(`Error deleting Keycloak user: ${err}`);
    }
  },
  addUserToGroup: async (
    keycloakClient /* : Object */,
    { username, groupName } /* : {username: string, groupName: string} */,
  ) => {
    try {
      // Find the Keycloak user id by username
      const keycloakUserId = await KeycloakOperations.findUserIdByUsername(
        keycloakClient,
        username,
      );

      // Find the Keycloak group id by name
      const keycloakGroupId = R.path(
        [0, 'id'],
        await keycloakClient.groups.find({
          search: groupName,
        }),
      );

      // Add the user to the group
      await keycloakClient.users.addToGroup({
        id: keycloakUserId,
        groupId: keycloakGroupId,
      });

      logger.debug(
        `Added Keycloak user with username ${username} to group "${groupName}"`,
      );
    } catch (err) {
      logger.error(`Error adding Keycloak user to group: ${err}`);
      throw new Error(`Error adding Keycloak user to group: ${err}`);
    }
  },
  deleteUserFromGroup: async (
    keycloakClient /* : Object */,
    { username, groupName } /* : {username: string, groupName: string} */,
  ) => {
    try {
      // Find the Keycloak user id by username
      const keycloakUserId = await KeycloakOperations.findUserIdByUsername(
        keycloakClient,
        username,
      );

      // Find the Keycloak group id by name
      const keycloakGroupId = R.path(
        [0, 'id'],
        await keycloakClient.groups.find({
          search: groupName,
        }),
      );

      // Delete the user from the group
      await keycloakClient.users.delFromGroup({
        id: keycloakUserId,
        groupId: keycloakGroupId,
      });

      logger.debug(
        `Deleted Keycloak user with username ${username} from group "${groupName}"`,
      );
    } catch (err) {
      logger.error(`Error deleting Keycloak user from group: ${err}`);
      throw new Error(`Error deleting Keycloak user from group: ${err}`);
    }
  },
};

module.exports = KeycloakOperations;
