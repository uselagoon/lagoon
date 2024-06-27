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
    priority,
    bulkId,
    bulkName,
    buildStep,
    sourceType,
    sourceUser,
  }: {
    id: number,
    name: string,
    status: string,
    created: number,
    started: number,
    completed: number,
    environment: string,
    remoteId: number,
    priority: number,
    bulkId: string,
    bulkName: string,
    buildStep: string,
    sourceType?: string,
    sourceUser?: string,
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
        priority,
        bulkId,
        bulkName,
        buildStep,
        sourceType,
        sourceUser,
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
      .select({ pid: 'environment.project' })
      .join('environment', 'deployment.environment', '=', 'environment.id')
      .where('deployment.id', id)
      .toString()
};
