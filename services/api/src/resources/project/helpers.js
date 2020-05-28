// @flow

/* ::
import type MariaSQL from 'mariasql';
*/

const R = require('ramda');
const { asyncPipe } = require('@lagoon/commons/src/util');
const { query } = require('../../util/db');

const Sql = require('./sql');

const Helpers = (sqlClient /* : MariaSQL */) => {
  const getProjectById = async (id /* : string */) => {
    const rows = await query(sqlClient, Sql.selectProject(id));
    return R.prop(0, rows);
  };

  const getProjectByName = async (name /* : string */) => {
    const rows = await query(sqlClient, Sql.selectProjectByName(name));
    return R.prop(0, rows);
  };

  const getProjectByEnvironmentId = async (environmentId) => {
    const rows = await query(sqlClient, Sql.selectProjectByEnvironmentId(environmentId));
    return R.prop(0, rows);
  }

  const getProjectsByIds = (projectIds /* : Array<number> */) =>
    query(sqlClient, Sql.selectProjectsByIds(projectIds));

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
    getProjectByName,
    getProjectsByIds,
    getProjectByEnvironmentId,
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
    getAllProjectsNotIn: async ids =>
      query(sqlClient, Sql.selectAllProjectNotIn(ids)),
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
  };
};

module.exports = Helpers;
