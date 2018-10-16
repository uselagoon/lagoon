// @flow

const R = require('ramda');
const keycloakClient = require('../../clients/keycloakClient');
const logger = require('../../logger');

const KeycloakOperations = {
  findUserIdByUsername: async (username /* : string */) =>
    R.path(
      [0, 'id'],
      await keycloakClient.users.findOne({
        username,
      }),
    ),
  createUser: async (
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
  deleteUserById: async (
    keycloakUserId /* : string */,
    username /* : string */,
  ) => {
    try {
      // Delete the user
      await keycloakClient.users.del({ id: keycloakUserId });

      logger.debug(`Deleted Keycloak user with username "${username}"`);
    } catch (err) {
      logger.error(`Error deleting Keycloak user: ${err}`);
      throw new Error(`Error deleting Keycloak user: ${err}`);
    }
  },
  deleteUserByUsername: async (username /* : string */) => {
    try {
      // Find the Keycloak user id with a username matching the username
      const keycloakUserId = await KeycloakOperations.findUserIdByUsername(
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
  linkUserToGitlab: async (
    { username, gitlabUserId } /* : {username: string, gitlabUserId: number} */,
  ) => {
    try {
      // Find the Keycloak user id with a username matching the username
      const keycloakUserId = await KeycloakOperations.findUserIdByUsername(
        username,
      );

      // Add Gitlab Federated Identity to User
      await keycloakClient.users.addToFederatedIdentity({
        id: keycloakUserId,
        federatedIdentityId: 'gitlab',
        federatedIdentity: {
          identityProvider: 'gitlab',
          userId: gitlabUserId,
          userName: gitlabUserId, // we don't map the username, instead just use the UID again
        },
      });

      logger.debug(
        `Added User "${username}" to Gitlab Federated Identity ID ${gitlabUserId}`,
      );
    } catch (err) {
      logger.error(
        `Error adding User "${username}" to Gitlab Federated Identity: ${err}`,
      );
      throw new Error(
        `Error adding User "${username}" to Gitlab Federated Identity: ${err}`,
      );
    }
  },
  removeGitlabLink: async (username /* : string */) => {
    try {
      // Find the Keycloak user id with a username matching the username
      const keycloakUserId = await KeycloakOperations.findUserIdByUsername(
        username,
      );

      // Add Gitlab Federated Identity to User
      await keycloakClient.users.delFromFederatedIdentity({
        id: keycloakUserId,
        federatedIdentityId: 'gitlab',
      });

      logger.debug(`Removed User "${username}" from Gitlab Federated Identity`);
    } catch (err) {
      logger.error(
        `Error removing User "${username}" from Gitlab Federated Identity: ${err}`,
      );
      throw new Error(
        `Error removing User "${username}" from Gitlab Federated Identity: ${err}`,
      );
    }
  },
  addUserToGroup: async (
    { username, groupName } /* : {username: string, groupName: string} */,
  ) => {
    try {
      // Find the Keycloak user id by username
      const keycloakUserId = await KeycloakOperations.findUserIdByUsername(
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
    { username, groupName } /* : {username: string, groupName: string} */,
  ) => {
    try {
      // Find the Keycloak user id by username
      const keycloakUserId = await KeycloakOperations.findUserIdByUsername(
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
