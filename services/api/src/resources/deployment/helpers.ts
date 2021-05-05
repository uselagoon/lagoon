import * as R from 'ramda';
import { MariaClient } from 'mariasql';
import { asyncPipe } from '@lagoon/commons/dist/util';
import { sqlClientPool } from '../../clients/sqlClient';
import { query } from '../../util/db';
import { Sql } from './sql';
import { Helpers as environmentHelpers } from '../environment/helpers';

export const Helpers = (sqlClient: MariaClient) => {
  const getDeploymentById = async (deploymentID: number) => {
    const rows = await query(sqlClient, Sql.selectDeployment(deploymentID));
    return R.prop(0, rows);
  };

  return {
    getDeploymentById,
    getDeploymentByDeploymentInput: async deploymentInput => {
      const notEmpty = R.complement(R.anyPass([R.isNil, R.isEmpty]));
      const hasId = R.both(R.has('id'), R.propSatisfies(notEmpty, 'id'));
      const hasName = R.both(R.has('name'), R.propSatisfies(notEmpty, 'name'));
      const hasEnvironment = R.both(
        R.has('environment'),
        R.propSatisfies(notEmpty, 'environment'),
      );
      // @ts-ignore
      const hasNameAndEnvironment = R.both(hasName, hasEnvironment);

      const deploymentFromId = asyncPipe(
        R.prop('id'),
        getDeploymentById,
        deployment => {
          if (!deployment) {
            throw new Error('Unauthorized');
          }

          return deployment;
        },
      );

      const deploymentFromNameEnv = async input => {
        const environments = await environmentHelpers(
          sqlClientPool,
        ).getEnvironmentsByEnvironmentInput(R.prop('environment', input));
        const activeEnvironments = R.filter(
          R.propEq('deleted', '0000-00-00 00:00:00'),
          environments,
        );

        if (activeEnvironments.length < 1 || activeEnvironments.length > 1) {
          throw new Error('Unauthorized');
        }

        const environment = R.prop(0, activeEnvironments);

        const rows = await query(
          sqlClient,
          Sql.selectDeploymentByNameAndEnvironment(
            R.prop('name', input),
            environment.id,
          ),
        );

        if (!R.prop(0, rows)) {
          throw new Error('Unauthorized');
        }

        return R.prop(0, rows);
      };

      return R.cond([
        [hasId, deploymentFromId],
        [hasNameAndEnvironment, deploymentFromNameEnv],
        [
          R.T,
          () => {
            throw new Error(
              'Must provide deployment (id) or (name and environment)',
            );
          },
        ],
      ])(deploymentInput);
    },
  };
};
