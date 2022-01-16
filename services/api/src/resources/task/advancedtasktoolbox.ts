import * as R from 'ramda';
import { query } from '../../util/db';
import { Sql } from './sql';
import { Helpers } from './helpers';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Helpers as projectHelpers } from '../project/helpers';
import { Validators as envValidators } from '../environment/validators';
import {
  TaskRegistration,
  newTaskRegistrationFromObject
} from './models/taskRegistration';
import convertDateToMYSQLDateTimeFormat from '../../util/convertDateToMYSQLDateTimeFormat';
import { sqlClientPool } from '../../clients/sqlClient';



export const advancedTaskFunctions = (sqlClientPool, hasPermission = null) => {
    //Here we use partial application to generate a query runner
    //This allows us to replace whatever is doing the running with some mocked object if we need.

    const queryRunner = R.partial(query, [sqlClientPool]);

    //Note, following the injection functionality above, we also pass through environment and project helpers that can be mocked.
    return advancedTaskFunctionFactory(queryRunner, hasPermission, Sql, environmentHelpers(sqlClientPool), projectHelpers(sqlClientPool));
}

export const advancedTaskFunctionFactory = (queryRunner, hasPermission = null, Sql, environmentHelpers, projectHelpers) => {

    return {
      advancedTaskDefinitionById: async function(id) {
        // const rows = await query(
        //   sqlClientPool,
        //   Sql.selectAdvancedTaskDefinition(id)
        // );
        const rows = await queryRunner(Sql.selectAdvancedTaskDefinition(id))
        let taskDef = R.prop(0, rows);
        taskDef.advancedTaskDefinitionArguments = await this.advancedTaskDefinitionArguments(
          taskDef.id
        );
        return taskDef;
      },
      advancedTaskDefinitionArguments: async function(task_definition_id) {
        // const rows = await query(
        //   sqlClientPool,
        //   Sql.selectAdvancedTaskDefinitionArguments(task_definition_id)
        // );
        const rows = await queryRunner(Sql.selectAdvancedTaskDefinitionArguments(task_definition_id))
        let taskDefArgs = rows;
        return taskDefArgs;
      },
      canUserSeeTaskDefinition: async(advancedTaskDefinition) => {
        // console.log(environmentHelpers);
        //either project, environment, or group will be - we have to run different checks for each possibility
        if(advancedTaskDefinition.environment !== null) {
          let env = await environmentHelpers.getEnvironmentById(advancedTaskDefinition.environment);
          await hasPermission('task', 'view', {
            project: env.project
          });

          return true;
        } else if (advancedTaskDefinition.project !== null) {
          await hasPermission('task', 'view', {
            project: advancedTaskDefinition.project
          });
          return true;
        } else if (advancedTaskDefinition.groupName !== null) {
          //TODO: Check group permissions
        }
        return false;
      }
    };
  };
