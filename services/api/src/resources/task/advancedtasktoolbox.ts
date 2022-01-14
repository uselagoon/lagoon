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
    return advancedTaskFunctionFactory(sqlClientPool, hasPermission, Sql, environmentHelpers, projectHelpers);
}

export const advancedTaskFunctionFactory = (sqlClientPool, hasPermission = null, Sql, environmentHelpers, projectHelpers) => {
    return {
      advancedTaskDefinitionById: async function(id) {
        const rows = await query(
          sqlClientPool,
          Sql.selectAdvancedTaskDefinition(id)
        );
        let taskDef = R.prop(0, rows);
        taskDef.advancedTaskDefinitionArguments = await this.advancedTaskDefinitionArguments(
          taskDef.id
        );
        return taskDef;
      },
      advancedTaskDefinitionArguments: async function(task_definition_id) {
        const rows = await query(
          sqlClientPool,
          Sql.selectAdvancedTaskDefinitionArguments(task_definition_id)
        );
        let taskDefArgs = rows;
        return taskDefArgs;
      },
      canUserSeeTaskDefinition: async(advancedTaskDefinition) => {

        //either project, environment, or group will be - we have to run different checks for each possibility
        if(advancedTaskDefinition.environment !== null) {

          let env = await environmentHelpers(sqlClientPool).getEnvironmentById(advancedTaskDefinition.environment);
          // let project = await projectHelpers(sqlClientPool).getProjectById(advancedTaskDefinition.project);


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

        }
        return false;
      }
    };
  };
