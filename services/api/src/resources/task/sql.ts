import { knex } from '../../util/db';

export const Sql = {
  selectTask: (id: number) =>
    knex('task')
      .where('task.id', '=', id)
      .toString(),
  insertTask: ({
    id,
    name,
    status,
    created,
    started,
    completed,
    environment,
    service,
    command,
    remoteId
  }: {
    id: number;
    name: string;
    status: string;
    created: string;
    started: string;
    completed: string;
    environment: number;
    service: string;
    command: string;
    remoteId: string;
  }) =>
    knex('task')
      .insert({
        id,
        name,
        status,
        created,
        started,
        completed,
        environment,
        service,
        command,
        remoteId
      })
      .toString(),
  deleteTask: (id: number) =>
    knex('task')
      .where('id', id)
      .del()
      .toString(),
  updateTask: ({ id, patch }: { id: number; patch: { [key: string]: any } }) =>
    knex('task')
      .where('id', id)
      .update(patch)
      .toString(),
  selectPermsForTask: (id: number) =>
    knex('task')
      .select({ pid: 'environment.project' })
      .join('environment', 'task.environment', '=', 'environment.id')
      .where('task.id', id)
      .toString()
};
