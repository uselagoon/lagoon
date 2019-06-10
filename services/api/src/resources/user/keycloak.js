// @flow

const R = require('ramda');
const pickNonNil = require('../../util/pickNonNil');
const { keycloakAdminClient } = require('../../clients/keycloakClient');
const logger = require('../../logger');

const KeycloakOperations = {
  findUserIdByUsername: async (username /* : string */) =>
    R.path(
      [0, 'id'],
      await keycloakAdminClient.users.findOne({
        username,
      }),
    ),
  createUser: async (user /* : any */) => {
    try {
      await keycloakAdminClient.users.create({
        ...pickNonNil(['email', 'firstName', 'lastName'], user),
        username: R.prop('email', user),
        enabled: true,
        attributes: {
          'lagoon-uid': [R.prop('id', user)],
        },
      });

      logger.debug(
        `Created Keycloak user with username ${R.prop('email', user)}`,
      );
    } catch (err) {
      if (err.response.status && err.response.status === 409) {
        logger.warn(
          `Failed to create already existing Keycloak user "${R.prop(
            'email',
            user,
          )}"`,
        );
      } else {
        logger.error(`Error creating Keycloak user: ${err}`);
        throw new Error(`Error creating Keycloak user: ${err}`);
      }
    }
    // If user has been created with a gitlabid, we map that ID to the user in Keycloak
    if (R.prop('gitlabId', user)) {
      await KeycloakOperations.linkUserToGitlab({
        username: R.prop('email', user),
        gitlabUserId: R.prop('gitlabId', user),
      });
    }
  },
  deleteUserById: async (
    keycloakUserId /* : string */,
    username /* : string */,
  ) => {
    try {
      // Delete the user
      await keycloakAdminClient.users.del({ id: keycloakUserId });

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
      await keycloakAdminClient.users.del({ id: keycloakUserId });

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
      await keycloakAdminClient.users.addToFederatedIdentity({
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
      await keycloakAdminClient.users.delFromFederatedIdentity({
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
        await keycloakAdminClient.groups.find({
          search: groupName,
        }),
      );

      // Add the user to the group
      await keycloakAdminClient.users.addToGroup({
        id: keycloakUserId,
        groupId: keycloakGroupId,
      });

      logger.debug(
        `Added Keycloak user with username "${username}" to group "${groupName}"`,
      );
    } catch (err) {
      logger.error(`Error adding Keycloak  with username "${username}" to group "${groupName}": ${err}`);
      throw new Error(`Error adding Keycloak  with username "${username}" to group "${groupName}": ${err}`);
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
        await keycloakAdminClient.groups.find({
          search: groupName,
        }),
      );

      // Delete the user from the group
      await keycloakAdminClient.users.delFromGroup({
        id: keycloakUserId,
        groupId: keycloakGroupId,
      });

      logger.debug(
        `Deleted Keycloak user with username ${username} from group "${groupName}"`,
      );
    } catch (err) {
      logger.error(`Error deleting Keycloak user  with username "${username}" to group "${groupName}": ${err}`);
      throw new Error(`Error deleting Keycloak user  with username "${username}" to group "${groupName}": ${err}`);
    }
  },
};

module.exports = KeycloakOperations;
