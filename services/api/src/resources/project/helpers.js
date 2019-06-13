// @flow

/* ::
import type MariaSQL from 'mariasql';
*/

const R = require('ramda');
const { asyncPipe } = require('@lagoon/commons/src/util');
const { keycloakAdminClient } = require('../../clients/keycloakClient');
const { query } = require('../../util/db');
const logger = require('../../logger');

// const userHelpers = require('../user/helpers');

const KeycloakOperations = require('../project/keycloak');
const Sql = require('../project/sql');

const Helpers = (sqlClient /* : MariaSQL */) => {
  const getProjectById = async (id /* : string */) => {
    const rows = await query(sqlClient, Sql.selectProject(id));
    return R.prop(0, rows);
  };

  const getProjectsWithoutDirectUserAccess = async (
    projectIds /* : Array<string> */,
    userIds /* : Array<number> */,
  ) =>
    query(
      sqlClient,
      Sql.selectProjectsWithoutDirectUserAccess(projectIds, userIds),
    );

  return {
    getProjectById,
    getProjectsWithoutDirectUserAccess,
    getProjectIdByName: async (name /* : string */) => {
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
    getProjectByProjectInput: async projectInput => {
      const notEmpty = R.complement(R.anyPass([R.isNil, R.isEmpty]));
      const hasId = R.both(R.has('id'), R.propSatisfies(notEmpty, 'id'));
      const hasName = R.both(R.has('name'), R.propSatisfies(notEmpty, 'name'));

      const projectFromId = asyncPipe(R.prop('id'), getProjectById, project => {
        if (!project) {
          throw new Error('Unauthorized');
        }

        return project;
      });

      const projectFromName = asyncPipe(R.prop('name'), async name => {
        const rows = await query(sqlClient, Sql.selectProjectByName(name));
        const project = R.prop(0, rows);

        if (!project) {
          throw new Error('Unauthorized');
        }

        return project;
      });

      return R.cond([
        [hasId, projectFromId],
        [hasName, projectFromName],
        [
          R.T,
          () => {
            throw new Error('Must provide project "id" or "name"');
          },
        ],
      ])(projectInput);
    },
    getAllProjects: async () => query(sqlClient, Sql.selectAllProjects()),
    getCustomerProjectsWithoutDirectUserAccess: async (
      customerIds /* : Array<number> */,
      userIds /* : Array<number> */,
    ) =>
      query(
        sqlClient,
        Sql.selectCustomerProjectsWithoutDirectUserAccess(customerIds, userIds),
      ),
    getAllProjectNames: async () =>
      R.map(
        R.prop('name'),
        await query(sqlClient, Sql.selectAllProjectNames()),
      ),
    // mapIfNoDirectProjectAccess: async (
    //   projectId /* : string */,
    //   customerId /* : number */,
    //   callback /* : ({keycloakUserId: string, keycloakUsername: string, keycloakGroupId: string, keycloakGroupName: string}) => Promise<void> */,
    // ) => {
    //   // Get the users given access to the customer
    //   const users = await userHelpers(sqlClient).getUsersByCustomerId(
    //     customerId,
    //   );

    //   // Remove all users from the Keycloak groups that correspond to all projects
    //   for (const user of users) {
    //     // Return the project in an array if the user id does not have other access via `project_user`.
    //     const projectName = R.path(
    //       [0, 'name'],
    //       await getProjectsWithoutDirectUserAccess(
    //         [projectId],
    //         [R.prop('id', user)],
    //       ),
    //     );

    //     const email = R.prop('email', user);
    //     const keycloakUserId = await userHelpers(
    //       sqlClient,
    //     ).getKeycloakUserIdByUsername(email);

    //     const keycloakGroupId = await KeycloakOperations.findGroupIdByName(
    //       projectName,
    //     );

    //     await callback({
    //       keycloakUserId,
    //       keycloakUsername: email,
    //       keycloakGroupId,
    //       keycloakGroupName: projectName,
    //     });
    //   }
    // },
    // Given a lagoon project, add all users (direct and indirect) that have access to the projects
    // corresponding keycloak group.
    // addProjectUsersToKeycloakGroup: async (project /* : Object */) => {
    //   const users = await query(
    //     sqlClient,
    //     Sql.selectAllUsersForProjectId(project.id),
    //   );

    //   const keycloakGroupId = await KeycloakOperations.findGroupIdByName(
    //     project.name,
    //   );

    //   for (const user of users) {
    //     const email = R.prop('email', user);
    //     const keycloakUserId = await userHelpers(
    //       sqlClient,
    //     ).getKeycloakUserIdByUsername(email);

    //     await keycloakAdminClient.users.addToGroup({
    //       id: keycloakUserId,
    //       groupId: keycloakGroupId,
    //     });
    //     logger.debug(`Added Keycloak user ${email} to group "${project.name}"`);
    //   }
    // },
  };
};

module.exports = Helpers;
