const { knex } = require('../../util/db');

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
    remoteId,
    type = null,
    advanced_image = null,
    advanced_payload = null,
  }: {
    id: number,
    name: string,
    status: string,
    created: string,
    started: string,
    completed: string,
    environment: number,
    service: string,
    command: string,
    remoteId: string,
    type?: string,
    advanced_image?: string,
    advanced_payload?: string,
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
        remoteId,
        type,
        advanced_image,
        advanced_payload,
      })
      .toString(),
  deleteTask: (id: number) =>
    knex('task')
      .where('id', id)
      .del()
      .toString(),
  updateTask: ({ id, patch }: { id: number, patch: { [key: string]: any } }) =>
    knex('task')
      .where('id', id)
      .update(patch)
      .toString(),
  selectPermsForTask: (id: number) =>
    knex('task')
      .select({ pid: 'project.id' })
      .join('environment', 'task.environment', '=', 'environment.id')
      .join('project', 'environment.project', '=', 'project.id')
      .where('task.id', id)
      .toString(),
  insertAdvancedTaskDefinition: ({
    id,
    name,
    description,
    image,
    created,
    }: {
      id: number,
      name: string,
      description: string,
      image: string,
      created: string,
    }) =>
    knex('task_definition')
      .insert({
        id,
        name,
        description,
        image,
        created,
      })
    .toString(),
    insertAdvancedTaskDefinitionArgument: ({
      id,
      task_definition,
      name,
      type
      }: {
        id: number,
        task_definition: string,
        name: string,
        type: string,
      }) =>
      knex('task_definition_argument')
        .insert({
          id,
          task_definition,
          name,
          type
        })
      .toString(),
  selectAdvancedTaskDefinition:(id: number) =>
    knex('task_definition')
      .where('task_definition.id', '=', id)
      .toString(),
  selectAdvancedTaskDefinitionArguments:(id: number) =>
      knex('task_definition_argument')
        .where('task_definition_argument.task_definition', '=', id)
        .toString(),
  selectAdvancedTaskDefinitionByName:(name: string) =>
    knex('task_definition')
      .where('task_definition.name', '=', name)
      .toString(),
  selectAdvancedTaskDefinitions:() =>
    knex('task_definition')
    .toString(),
};
