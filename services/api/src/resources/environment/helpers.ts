import * as R from 'ramda';
import { Pool } from 'mariadb';
import { asyncPipe } from '@lagoon/commons/dist/util/func';
import { query } from '../../util/db';
import { Sql } from './sql';
import { Sql as problemSql } from '../problem/sql';
import { Sql as factSql } from '../fact/sql';
import { Helpers as projectHelpers } from '../project/helpers';
// import { logger } from '../../loggers/logger';

export const Helpers = (sqlClientPool: Pool) => {
  const aliasOpenshiftToK8s = (environments: any[]) => {
    return environments.map(environment => {
      return {
        ...environment,
        kubernetesNamespaceName: environment.openshiftProjectName
      };
    });
  };

  const getEnvironmentById = async (environmentID: number) => {
    const rows = await query(
      sqlClientPool,
      Sql.selectEnvironmentById(environmentID)
    );
    const withK8s = aliasOpenshiftToK8s(rows);
    return R.prop(0, withK8s);
  };

  return {
    aliasOpenshiftToK8s,
    getEnvironmentById,
    deleteEnvironment: async (name: string, eid: number, pid: number) => {
      // clean up environment variables
      // logger.debug(`deleting environment ${name}/id:${eid}/project:${pid} environment variables`)
      await query(
        sqlClientPool,
        Sql.deleteEnvironmentVariables(eid)
      );
      // clean up servies
      // logger.debug(`deleting environment ${name}/id:${eid}/project:${pid} environment services`)
      await query(
        sqlClientPool,
        Sql.deleteServices(eid)
      );
      // @TODO: environment_storage, deployment, environment_backup, task, environment_problem, environment_fact
      // delete the environment
      // logger.debug(`deleting environment ${name}/id:${eid}/project:${pid}`)
      await query(
        sqlClientPool,
        Sql.deleteEnvironment(name, pid)
      );

      // Here we clean up insights attached to the environment

      await query(
        sqlClientPool,
        factSql.deleteFactsForEnvironment(eid)
      );

      await query(
        sqlClientPool,
        problemSql.deleteProblemsForEnvironment(eid)
      );

    },
    getEnvironmentsDeploytarget: async (eid) => {
      const rows = await query(
        sqlClientPool,
        Sql.selectDeployTarget(eid)
      );
      return aliasOpenshiftToK8s(rows);
    },
    getEnvironmentsByProjectId: async (projectId) => {
      const rows = await query(
        sqlClientPool,
        Sql.selectEnvironmentsByProjectID(projectId)
      );
      return aliasOpenshiftToK8s(rows);
    },
    getEnvironmentByNameAndProject: async (environmentName, projectId) => {
      const rows = await query(
        sqlClientPool,
        Sql.selectEnvironmentByNameAndProject(
          environmentName,
          projectId
        )
      );
      if (!R.prop(0, rows)) {
        throw new Error('Unauthorized');
      }

      return rows;
    },
    getEnvironmentsByEnvironmentInput: async environmentInput => {
      const notEmpty = R.complement(R.anyPass([R.isNil, R.isEmpty]));
      const hasId = R.both(R.has('id'), R.propSatisfies(notEmpty, 'id'));
      const hasName = R.both(R.has('name'), R.propSatisfies(notEmpty, 'name'));
      const hasProject = R.both(
        R.has('project'),
        R.propSatisfies(notEmpty, 'project')
      );
      // @ts-ignore
      const hasNameAndProject = R.both(hasName, hasProject);

      const envFromId = asyncPipe(
        R.prop('id'),
        getEnvironmentById,
        environment => {
          if (!environment) {
            throw new Error('Unauthorized');
          }

          return [environment];
        }
      );

      const envFromNameProject = async input => {
        const project = await projectHelpers(
          sqlClientPool
        ).getProjectByProjectInput(R.prop('project', input));
        const rows = await query(
          sqlClientPool,
          Sql.selectEnvironmentByNameAndProject(
            R.prop('name', input),
            project.id
          )
        );

        if (!R.prop(0, rows)) {
          throw new Error('Unauthorized');
        }

        return rows;
      };

      return R.cond([
        [hasId, envFromId],
        // @ts-ignore
        [hasNameAndProject, envFromNameProject],
        [
          R.T,
          () => {
            throw new Error(
              'Must provide environment (id) or (name and project)'
            );
          }
        ]
      // @ts-ignore
      ])(environmentInput);
    }
  };
};
