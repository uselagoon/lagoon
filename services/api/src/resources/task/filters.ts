import * as R from 'ramda';

export const Filters = {
    filterAdminTasks: async (hasPermission, rows) => {
        let adminTasks = false
        // do a check of all returned tasks for any that are admin tasks
        for (const row of rows) {
          if (row.adminOnlyView == true) {
            adminTasks = true;
            break;
          }
        }

        // if any of the tasks are admin tasks, check the user has admin permission
        if (adminTasks) {
          // we do this so we only check admin permission once, instead of on all tasks
          try {
            await hasPermission('project', 'viewAll');
          } catch (err) {
            return rows.filter((row) => row.adminOnlyView != true);
          }
        }
        // else we simply return the rows untouched
        return rows;
    }
}