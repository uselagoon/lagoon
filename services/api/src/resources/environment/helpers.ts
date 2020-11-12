import * as R from 'ramda';
import { MariaClient } from 'mariasql';
import { asyncPipe } from '@lagoon/commons/dist/util';
import { query } from '../../util/db';
import { Sql } from './sql';
import { Helpers as projectHelpers } from '../project/helpers';

export const Helpers = (sqlClient: MariaClient) => {
  const aliasOpenshiftToK8s = (environments: any[]) => {
    return environments.map(environment => {
      return {
        ...environment,
        kubernetesNamespaceName: environment.openshiftProjectName,
      }
    });
  };

  const getEnvironmentById = async (environmentID: number) => {
    const rows = await query(
      sqlClient,
      Sql.selectEnvironmentById(environmentID),
    );
    const withK8s = aliasOpenshiftToK8s(rows);
    return R.prop(0, withK8s);
  };

  return {
    aliasOpenshiftToK8s,
    getEnvironmentById,
    getEnvironmentsByEnvironmentInput: async environmentInput => {
      const notEmpty = R.complement(R.anyPass([R.isNil, R.isEmpty]));
      const hasId = R.both(R.has('id'), R.propSatisfies(notEmpty, 'id'));
      const hasName = R.both(R.has('name'), R.propSatisfies(notEmpty, 'name'));
      const hasProject = R.both(
        R.has('project'),
        R.propSatisfies(notEmpty, 'project'),
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
        },
      );

      const envFromNameProject = async input => {
        const project = await projectHelpers(sqlClient).getProjectByProjectInput(
          R.prop('project', input),
        );
        const rows = await query(
          sqlClient,
          Sql.selectEnvironmentByNameAndProject(
            R.prop('name', input),
            project.id,
          ),
        );

        if (!R.prop(0, rows)) {
          throw new Error('Unauthorized');
        }

        return rows;
      };

      return R.cond([
        [hasId, envFromId],
        [hasNameAndProject, envFromNameProject],
        [
          R.T,
          () => {
            throw new Error(
              'Must provide environment (id) or (name and project)',
            );
          },
        ],
      ])(environmentInput);
    },
  };
};
