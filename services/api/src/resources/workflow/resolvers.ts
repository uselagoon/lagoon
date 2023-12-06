import { WorkflowInterface, WorkflowInputInterface } from "../../models/workflows";
import Sql from "./sql";
import { query, isPatchEmpty } from '../../util/db';
import { ResolverFn } from '../';
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
  async canDeleteWorkflow() {
    return await this.hasPermissions('advanced_task', 'delete:advanced');
  }
}


export const getWorkflowsByEnvironmentId = async (
{ id },
{},
extras
) => {
  return await resolveWorkflowsForEnvironment({}, {environment: id}, extras);
}

export const addWorkflow: ResolverFn = async (
    root,
    { input },
    { sqlClientPool, hasPermission, models, userActivityLogger }
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

  userActivityLogger(`User added a workflow '${insertId}'`, {
    project: '',
    event: 'api:addWorkflow',
    payload: {
      data: {
        name: input.name,
        event: input.event,
        project: input.project,
        advanced_task_definition: input.advancedTaskDefinition
      }
    }
  });

  return workflowObj[0];
}

export const updateWorkflow: ResolverFn = async (
  root,
  {
    input: {
      id,
      patch,
      patch: {
        name,
        event,
        project,
        advanced_task_definition: advancedTaskDefinition,
      }
    }
  }: { input: { id: number, patch: WorkflowInputInterface } },
  { sqlClientPool, hasPermission, models, userActivityLogger }
) => {
  if (isPatchEmpty({ patch })) {
    throw new Error('Input patch requires at least 1 attribute');
  }

  const perms = new WorkflowPermissionHandler(hasPermission);
  perms.canCreateWorkflow();

  await query(
    sqlClientPool,
    Sql.updateWorkflow({
      id,
      patch: {
        name,
        event,
        project,
        advanced_task_definition: advancedTaskDefinition,
      }
    })
  );

  let workflowObj = await query(
      sqlClientPool,
      Sql.selectWorkflowById(id)
  );

  userActivityLogger(`User updated a workflow '${id}'`, {
    project: '',
    event: 'api:updateWorkflow',
    payload: {
      id: id,
      patch: {
        name,
        event,
        project,
        advanced_task_definition: advancedTaskDefinition
      }
    }
  });

  return workflowObj[0];
}

export const deleteWorkflow: ResolverFn = async (
  root,
  { input: { id } },
  { sqlClientPool, hasPermission, models, userActivityLogger }
) => {
  const perms = new WorkflowPermissionHandler(hasPermission);
  perms.canDeleteWorkflow();

  let workflowObj = await query(
      sqlClientPool,
      Sql.selectWorkflowById(id)
  );

  if (workflowObj[0] == "undefined" || workflowObj[0] == null) {
    throw new Error('Workflow not found');
  }

  try {
    await query(
      sqlClientPool,
      Sql.deleteWorkflow(id)
    );

    return `successfully deleted workflow ${id}`;
  } catch (error) {
    return `failed to delete workflow: ${error}`;
  }
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
