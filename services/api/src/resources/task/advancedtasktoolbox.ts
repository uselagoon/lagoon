import * as R from 'ramda';
import { query } from '../../util/db';
import { IKeycloakAuthAttributes, KeycloakUnauthorizedError } from '../../util/auth';
import { Sql } from './sql';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Helpers as projectHelpers } from '../project/helpers';

export const advancedTaskFunctions = (sqlClientPool, models, hasPermission = null, adminScopes) => {
  // Here we use partial application to generate a query runner
  // This allows us to replace whatever is doing the running with some mocked object if we need.

  const queryRunner = R.partial(query, [sqlClientPool]);

  // Note, following the injection functionality above, we also pass through environment and project helpers that can be mocked.
  return advancedTaskFunctionFactory(queryRunner, hasPermission, models, Sql, environmentHelpers(sqlClientPool), projectHelpers(sqlClientPool), adminScopes);
};

export const advancedTaskFunctionFactory = (queryRunner, hasPermission = null, models, Sql, environmentHelpers, projectHelpers, adminScopes) => {
  // This provides a reasonable alternative to simply throwing errors if permission checks fail.
  const tryCatchHaspermission = async (resource, scope, attributes: IKeycloakAuthAttributes) => {
    try {
      await hasPermission(resource, scope, attributes);
    } catch (e) {
      if (e instanceof KeycloakUnauthorizedError) {
        return false;
      }
      // if tihs isn't an expected exception, we have to rethrow;
      throw e;
    }
    return true;
  };

  return {
    async advancedTaskDefinitionById(id) {
      const rows = await queryRunner(Sql.selectAdvancedTaskDefinition(id));
      const taskDef = R.prop(0, rows);
      taskDef.advancedTaskDefinitionArguments = await this.advancedTaskDefinitionArguments(
        taskDef.id,
      );
      return taskDef;
    },
    async advancedTaskDefinitionArguments(task_definition_id) {
      const rows = await queryRunner(Sql.selectAdvancedTaskDefinitionArguments(task_definition_id));
      const taskDefArgs = rows;
      return taskDefArgs;
    },
    permissions: {
      canUserSeeTaskDefinition: async (advancedTaskDefinition) => {
        // either project, environment, or group will be - we have to run different checks for each possibility
        if (advancedTaskDefinition.environment !== null) {
          const env = await environmentHelpers.getEnvironmentById(advancedTaskDefinition.environment);
          if (adminScopes.platformViewer) {
            return true;
          }
          return await tryCatchHaspermission('task', 'view', {
            project: env.project,
          });
        } if (advancedTaskDefinition.project !== null) {
          if (adminScopes.platformViewer) {
            return true;
          }
          return await tryCatchHaspermission('task', 'view', {
            project: advancedTaskDefinition.project,
          });
        } if (advancedTaskDefinition.groupName !== null) {
          const group = await models.GroupModel.loadGroupByIdOrName({
            name: advancedTaskDefinition.groupName,
          });

          return await tryCatchHaspermission('group', 'update', {
            group: group.id,
          });
        }
        return false;
      },
    },
  };
};
