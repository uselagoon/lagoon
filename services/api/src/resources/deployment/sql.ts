import { knex } from '../../util/db';

export const Sql = {
  selectDeployment: (id: number) =>
    knex('deployment')
      .where('id', '=', id)
      .toString(),
  selectDeploymentByNameAndEnvironment: (name: string, environmentId: number) =>
    knex('deployment')
      .where('name', '=', name)
      .andWhere('environment', '=', environmentId)
      .toString(),
  insertDeployment: ({
    id,
    name,
    status,
    created,
    started,
    completed,
    environment,
    remoteId,
  }: {
    id: number,
    name: string,
    status: string,
    created: number,
    started: number,
    completed: number,
    environment: string,
    remoteId: number,
  }) =>
    knex('deployment')
      .insert({
        id,
        name,
        status,
        created,
        started,
        completed,
        environment,
        remoteId,
      })
      .toString(),
  deleteDeployment: (id: number) =>
    knex('deployment')
      .where('id', id)
      .del()
      .toString(),
  updateDeployment: ({ id, patch }: { id: number, patch: { [key: string]: any } }) =>
    knex('deployment')
      .where('id', id)
      .update(patch)
      .toString(),
  selectPermsForDeployment: (id: number) =>
    knex('deployment')
      .select({ pid: 'project.id' })
      .join('environment', 'deployment.environment', '=', 'environment.id')
      .join('project', 'environment.project', '=', 'project.id')
      .where('deployment.id', id)
      .toString()
};
