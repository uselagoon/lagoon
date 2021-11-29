import { WorkflowInterface } from "../../models/workflows"
import Sql from "./sql";
import { query } from '../../util/db';
import { Helpers as projectHelpers } from '../project/helpers';

// Here we abstract permissions in case we want to change the underlying functionality later
// TODO: Question - do we want to handle the failure of perms checks _any other way_
// than simply throwing exceptions?
class WorkflowPermissionHandler {
  hasPermissions: any;
  constructor(hasPermissions) {
    this.hasPermissions = hasPermissions;
  }
  async canCreateWorkflow() {
    return await this.hasPermissions('advanced_task', 'create:advanced');
  }
  async canViewWorkflowForProject(projectId: number) {
    return true;
  }
}


export const getWorkflowsByEnvironmentId = async (
{ id },
{},
extras
) => {
  return await resolveWorkflowsForEnvironment({}, {environment: id}, extras);
}

export const addWorkflow = async (
    root,
    { input },
    { sqlClientPool, hasPermission, models }
) => {
  const perms = new WorkflowPermissionHandler(hasPermission);

  perms.canCreateWorkflow();

  const { insertId } = await query(
        sqlClientPool,
        Sql.insertWorkflow(input)
      );

    let workflowObj = await query(
        sqlClientPool,
        Sql.selectWorkflowById(insertId)
    );
    return workflowObj[0];
}


export const resolveAdvancedTaskDefinitionsForWorkflow = async(root, parameters, meta) => {
  const { id: workflowId } = root;
  const { sqlClientPool, hasPermission, models } = meta;
  const perms = new WorkflowPermissionHandler(hasPermission);
  let tasks = await query(sqlClientPool, Sql.selectTaskForWorkflow(workflowId));
  return tasks[0];
}

export const resolveWorkflowsForEnvironment = async (
    root,
    { environment },
    { sqlClientPool, hasPermission, models }
  ) => {


    let project = await projectHelpers(sqlClientPool).getProjectByEnvironmentId(environment);
    (new WorkflowPermissionHandler(hasPermission)).canViewWorkflowForProject(project.projectId);
    let workflowObjs = await query(
        sqlClientPool,
        Sql.selectWorkflowsForProject(project.projectId)
    );

    return workflowObjs;
  }


const saveWorkflow = (workflow: WorkflowInterface) => {
    //Save the workflow itself

    //Save each of the jobs

}

const deleteWorkflow = () => {



}
