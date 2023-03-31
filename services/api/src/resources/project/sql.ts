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
  selectProjectByName: (name: string) =>
    knex('project')
      .where('name', name)
      .toString(),
  selectProjectIdByName: (name: string) =>
    knex('project')
      .where('name', name)
      .select('id')
      .toString(),
  selectProjectsByIds: (projectIds: number[]) =>
    knex('project as p')
      .whereIn('p.id', projectIds)
      .toString(),
  selectProjectsByOrganizationId: (organizationId: number) =>
    knex('project as p')
      .where('p.organization', organizationId)
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
      .andWhere('e.deleted', '=', '0000-00-00 00:00:00')
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
        { projectId: 'p.id'}
      )
      .leftJoin('project as p', 'p.id', '=', 'e.project');
    if (environmentType && environmentType.length > 0) {
      q.where('e.environment_type', environmentType);
    }
    q.where('e.id', environmentId);
    return q.toString();
  },
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
      openshiftProjectPattern,
      activeSystemsDeploy = "lagoon_controllerBuildDeploy",
      activeSystemsPromote = "lagoon_controllerBuildDeploy",
      activeSystemsRemove = "lagoon_controllerRemove",
      activeSystemsTask = "lagoon_controllerJob",
      activeSystemsMisc = "lagoon_controllerMisc",
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
      productionBuildPriority = 5,
      developmentBuildPriority = 6,
      deploymentsDisabled = 0,
      developmentEnvironmentsLimit = 5,
      organization
    } = input;

    return knex('project').insert({
    id,
    name,
    gitUrl,
    availability,
    privateKey,
    subfolder,
    routerPattern,
    activeSystemsDeploy,
    activeSystemsPromote,
    activeSystemsRemove,
    activeSystemsTask,
    activeSystemsMisc,
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
    openshiftProjectPattern,
    developmentEnvironmentsLimit,
    organization
  }).toString();
 }
};
