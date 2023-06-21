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
  selectDeployTarget: (id: number) =>
    knex('openshift')
      .where('id', '=', id)
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
      .update({deleted: knex.fn.now()}).toString(),
  deleteServices: (id: number) =>
    knex('environment_service')
      .where('environment', '=', id)
      .delete()
      .toString(),
};
