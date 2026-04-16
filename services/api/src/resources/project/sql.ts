import { knex } from '../../util/db';

export const Sql = {
  selectProject: (id: number) =>
    knex('project')
      .where('id', id)
      .toString(),
  selectAllProjectNames: () =>
    knex('project')
      .select('name')
      .toString(),
  selectAllProjects: () => knex('project').toString(),
  selectAllProjectNotIn: (ids: number) =>
    knex('project')
      .select('id', 'name')
      .whereNotIn('id', ids)
      .orderBy('id', 'asc')
      .toString(),
  selectAllProjectIDsNotIn: (ids) =>
    knex('project')
      .select(knex.raw('group_concat(id) as project_ids'))
      .whereNotIn('id', ids)
      .orderBy('id', 'asc')
      .toString(),
  selectAllProjectsIn: (ids: number) =>
    knex('project')
      .select('id')
      .whereIn('id', ids)
      .toString(),
  selectProjectByName: (name: string) =>
    knex('project')
      .where('name', name)
      .toString(),
  selectProjectById: (id: number) =>
    knex('project')
      .where('id', id)
      .limit(1)
      .toString(),
  selectProjectIdByName: (name: string) =>
    knex('project')
      .where('name', name)
      .select('id')
      .toString(),
  selectProjectByGitUrl: (git_url: string) =>
    knex('project')
      .where('git_url', git_url)
      .limit(1)
      .toString(),
  selectProjectsByIds: (projectIds: number[]) =>
    knex('project AS p')
      .whereIn('p.id', projectIds)
      .toString(),
  selectProjectsByOrganizationId: (organizationId: number) =>
    knex('project as p')
      .where('p.organization', organizationId)
      .toString(),
  selectProjectByEnvironmentID: (id: number) =>
    knex('environment as e')
      .select('project.*')
      .join('project', 'e.project', '=', 'project.id')
      .where(knex.raw('e.id = ?', id))
      .limit(1)
      .toString(),
  deleteEnvironmentVariables: (id: number) =>
    knex('env_vars')
      .where('project', '=', id)
      .delete()
      .toString(),
  deleteDeployTargetConfigs: (id: number) =>
    knex('deploy_target_config')
      .where('project', '=', id)
      .delete()
      .toString(),
  deleteNotifications: (id: number) =>
    knex('project_notification')
      .where('pid', '=', id)
      .delete()
      .toString(),
  deleteProject: (id: number) =>
    knex('project')
      .where('id', '=', id)
      .delete()
      .toString(),
  selectEnvironmentsByProjectId: (id: number) =>
    knex('environment as e')
      .where('e.project', '=', id)
      .andWhere('e.deleted', '0000-00-00 00:00:00')
      .toString(),
  selectProjectClone: (id: number) =>
    knex('project_clone')
      .where('id', '=', id)
      .toString(),
  insertProjectClone: ({
    sourceProject,
    destinationProject,
    status,
  }: {
    sourceProject: number,
    destinationProject: number,
    status: string,
  }) =>
    knex('project_clone')
      .insert({
        sourceProject,
        destinationProject,
        status,
      })
      .toString(),
  addProjectCloneToProject: (id: number, clone: number) =>
    knex('project')
      .where('id', id)
      .update('clone', clone)
      .toString(),
  deleteProjectClone: (id: number) =>
    knex('project_clone')
      .where('id', id)
      .del()
      .toString(),
  updateProjectClone: ({ id, status }: { id: number, status: string }) =>
    knex('project_clone')
      .where('id', id)
      .update('status', status)
      .update('updated', knex.fn.now())
      .toString(),
  selectTaskOrDeploymentByProjectClone: (cid: number, pid: number, type: string, project: string) =>
    knex('project_clone_task_deployments')
      .where('cid', '=', cid)
      .andWhere('pid', '=', pid)
      .andWhere('type', '=', type)
      .andWhere('project', '=', project)
      .toString(),
  addTaskOrDeploymentToProjectClone: ({cid, pid, tdid, project, type} : {cid: number, pid: number, tdid: number, project: string, type: string}) =>
    knex('project_clone_task_deployments')
      .insert({
        cid,
        project,
        type,
        pid,
        tdid
      })
      .toString(),
  deleteProjectCloneTaskDeployments: (cid: number) =>
    knex('project_clone_task_deployments')
      .where('cid', cid)
      .del()
      .toString(),
  selectProjectByEnvironmentId: (environmentId, environmentType = []) => {
    let q = knex('environment as e')
      .select(
        'e.id',
        { envName: 'e.name' },
        'e.environment_type',
        'e.project',
        'e.openshift_project_name',
        'p.name',
        { projectId: 'p.id'},
        'p.organization',
      )
      .leftJoin('project as p', 'p.id', '=', 'e.project');
    if (environmentType && environmentType.length > 0) {
      q.where('e.environment_type', environmentType);
    }
    q.where('e.id', environmentId);
    return q.toString();
  },
  selectProjectRestrictions: (pid: number) =>
    knex('project')
      .select('restrictions')
      .where('id', '=', pid)
      .toString(),
  updateProjectRestrictions: (pid: number, restrictions: string) =>
    knex('project')
      .where('id', '=', pid)
      .update('restrictions', restrictions)
      .toString(),
  updateProject: ({
    id,
    patch
  }: {
    id: number;
    patch: { [key: string]: any };
  }) =>
    knex('project')
      .where('id', '=', id)
      .update(patch)
      .toString(),
  truncateProject: () =>
    knex('project')
      .truncate()
      .toString(),
  createProject: (input) => {

    const {
      id,
      name,
      gitUrl,
      availability = "STANDARD",
      privateKey,
      subfolder,
      routerPattern,
      openshift,
      branches = "true",
      pullrequests = "true",
      productionEnvironment,
      productionRoutes,
      productionAlias = "lagoon-production",
      standbyProductionEnvironment,
      standbyRoutes,
      standbyAlias = "lagoon-standby",
      autoIdle = 1,
      storageCalc = 1,
      problemsUi = 0,
      factsUi = 0,
      productionBuildPriority = 6,
      developmentBuildPriority = 5,
      deploymentsDisabled = 0,
      developmentEnvironmentsLimit = 5,
      organization,
      buildImage,
      sharedBaasBucket
    } = input;

    return knex('project').insert({
    id,
    name,
    gitUrl,
    availability,
    privateKey,
    subfolder,
    routerPattern,
    branches,
    productionEnvironment,
    productionRoutes,
    productionAlias,
    standbyProductionEnvironment,
    standbyRoutes,
    standbyAlias,
    autoIdle,
    problemsUi,
    factsUi,
    productionBuildPriority,
    developmentBuildPriority,
    deploymentsDisabled,
    storageCalc,
    pullrequests,
    openshift,
    developmentEnvironmentsLimit,
    organization,
    buildImage,
    sharedBaasBucket
  }).toString();
 }
};
