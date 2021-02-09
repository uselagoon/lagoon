const { knex } = require('../../util/db');

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
      .toString(),
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
  deleteServices: (id: number) =>
    knex('environment_service')
      .where('environment', '=', id)
      .delete()
      .toString(),
};
