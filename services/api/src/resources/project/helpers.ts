import * as R from 'ramda';
import { Pool } from 'mariadb';
import { asyncPipe } from '@lagoon/commons/dist/util';
import { query } from '../../util/db';
import { Sql } from './sql';

export const Helpers = (sqlClientPool: Pool) => {
  const aliasOpenshiftToK8s = (projects: any[]) => {
    return projects.map(project => {
      return {
        ...project,
        kubernetes: project.openshift,
        kubernetesNamespacePattern: project.openshiftProjectPattern
      };
    });
  };

  const getProjectById = async (id: number) => {
    const rows = await query(sqlClientPool, Sql.selectProject(id));
    const withK8s = aliasOpenshiftToK8s(rows);
    return R.prop(0, withK8s);
  };

  const getProjectByName = async (name: string) => {
    const rows = await query(sqlClientPool, Sql.selectProjectByName(name));
    return R.prop(0, rows);
  };

  const getProjectByEnvironmentId = async (
    environmentId: number,
    environmentType = null
  ) => {
    const rows = await query(
      sqlClientPool,
      Sql.selectProjectByEnvironmentId(environmentId, environmentType)
    );
    return R.prop(0, rows);
  };

  const getProjectsByIds = (projectIds: number[]) =>
    query(sqlClientPool, Sql.selectProjectsByIds(projectIds));

  return {
    aliasOpenshiftToK8s,
    getProjectById,
    getProjectsByIds,
    getProjectByEnvironmentId,
    getProjectIdByName: async (name: string): Promise<number> => {
      const pidResult = await query(
        sqlClientPool,
        Sql.selectProjectIdByName(name)
      );

      const amount = R.length(pidResult);
      if (amount > 1) {
        throw new Error(
          `Multiple project candidates for '${name}' (${amount} found). Do nothing.`
        );
      }

      if (amount === 0) {
        throw new Error(`Not found: '${name}'`);
      }

      const pid = R.path(['0', 'id'], pidResult) as string;

      return parseInt(pid, 10);
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
        const rows = await query(sqlClientPool, Sql.selectProjectByName(name));
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
          }
        ]
      ])(projectInput);
    },
    getAllProjects: async () => query(sqlClientPool, Sql.selectAllProjects()),
    getAllProjectsNotIn: async ids =>
      query(sqlClientPool, Sql.selectAllProjectNotIn(ids)),
    getAllProjectNames: async () =>
      R.map(
        R.prop('name'),
        await query(sqlClientPool, Sql.selectAllProjectNames())
      ),
    deleteProjectById: async (id: number) => {
      await query(
        sqlClientPool,
        Sql.deleteNotifications(id)
      );
      // clean up environment variables for project
      await query(
        sqlClientPool,
        Sql.deleteEnvironmentVariables(id)
      );
      // clean up deploytarget configurations
      await query(
        sqlClientPool,
        Sql.deleteDeployTargetConfigs(id)
      );
      // delete the project
      await query(
        sqlClientPool,
        Sql.deleteProject(id)
      );
    }
  };
};
