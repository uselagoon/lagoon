import { knex } from '../../util/db';

export const Sql = {
  updateEnvironment: ({ id, patch }: { id: number, patch: { [key: string]: any } }) => {
    const updatePatch = {
      ...patch,
      updated: knex.fn.now(),
    };

    return knex('environment')
      .where('id', '=', id)
      .update(updatePatch)
      .toString();
  },
  selectEnvironmentById: (id: number) =>
    knex('environment')
      .where('id', '=', id)
      .toString(),
  selectEnvironmentByNameAndProject: (name: string, projectId: number) =>
    knex('environment')
      .where('name', '=', name)
      .andWhere('project', '=', projectId)
      .andWhere('deleted', '0000-00-00 00:00:00')
      .toString(),
  selectEnvironmentsByProjectID: (projectId: number, includeDeleted: boolean = false) => {
    let select = knex('environment')
      .select('id', 'name')
      .where('project', '=', projectId)
      .orderBy('id', 'desc');

      if(!includeDeleted) {
        select = select.andWhere('deleted', '0000-00-00 00:00:00');
      }

      return select.toString()
  },
  truncateEnvironment: () =>
    knex('environment')
      .truncate()
      .toString(),
  insertService: (
    environment: number,
    name: string,
  ) =>
    knex('environment_service')
      .insert({
        environment,
        name,
      })
      .toString(),
  selectServicesByEnvironmentId: (id: number) =>
    knex('environment_service')
      .where('environment', '=', id)
      .toString(),
  deleteEnvironmentVariables: (id: number) =>
    knex('env_vars')
      .where('environment', '=', id)
      .delete()
      .toString(),
  deleteEnvironment: (name: string, projectId: number) =>
    knex('environment')
      .where('name', name)
      .andWhere('project', projectId)
      .andWhere('deleted', '0000-00-00 00:00:00')
      .update({ deleted: knex.fn.now() }).toString(),
  deleteServices: (id: number) =>
    knex('environment_service')
      .where('environment', '=', id)
      .delete()
      .toString(),
  selectEnvironmentByDeploymentId: (id: number) =>
    knex('deployment')
      .select('e.*')
      .join('environment AS e', 'deployment.environment', '=', 'e.id')
      .join('project', 'e.project', '=', 'project.id')
      .where(knex.raw('deployment.id = ?', id))
      .limit(1)
      .toString(),
  selectEnvironmentByTaskId: (id: number) =>
    knex('task')
      .select('e.*')
      .join('environment AS e', 'task.environment', '=', 'e.id')
      .join('project', 'e.project', '=', 'project.id')
      .where(knex.raw('task.id = ?', id))
      .limit(1)
      .toString(),
  selectEnvironmentByBackupId: (id: number) =>
    knex('environment_backup')
      .select('e.*')
      .join('environment AS e', 'environment_backup.environment', '=', 'e.id')
      .join('project', 'e.project', '=', 'project.id')
      .where(knex.raw('environment_backup.id = ?', id))
      .limit(1)
      .toString(),
  selectEnvironmentStorageByEnvironmentId: (id: number) =>
    knex('environment_storage')
      .where('environment_storage.environment', '=', id)
      .toString(),
  selectEnvironmentByOpenshiftProjectName: (openshiftProjectName: string) =>
    knex('environment AS e')
      .select('e.*')
      .join('project', 'e.project', '=', 'project.id')
      .where('e.openshift_project_name', '=', openshiftProjectName)
      .andWhere('e.deleted', '0000-00-00 00:00:00')
      .toString(),
  canSshToEnvironment: (openshiftProjectName: string) =>
    knex('environment AS e')
      .select('e.*')
      .join('project', 'e.project', '=', 'project.id')
      .where('e.openshift_project_name', '=', openshiftProjectName)
      .toString(),
};
