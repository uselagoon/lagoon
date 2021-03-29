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
    knex('advanced_task_definition')
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
      advanced_task_definition,
      name,
      type
      }: {
        id: number,
        advanced_task_definition: number,
        name: string,
        type: string,
      }) =>
      knex('advanced_task_definition_argument')
        .insert({
          id,
          advanced_task_definition,
          name,
          type
        })
      .toString(),
    insertAdvancedTaskDefinitionEnvironmentLink: ({
        id,
        advanced_task_definition,
        environment
        }: {
          id: number,
          advanced_task_definition: string,
          environment
        }) =>
        knex('advanced_task_definition_environment')
          .insert({
            id,
            advanced_task_definition,
            environment
          })
        .toString(),
    insertAdvancedTaskDefinitionProjectLink: ({
        id,
        advanced_task_definition,
        project
        }: {
          id: number,
          advanced_task_definition: string,
          project
        }) =>
        knex('advanced_task_definition_project')
          .insert({
            id,
            advanced_task_definition,
            project
          })
        .toString(),
    insertTaskRegistration: ({
          id,
          type,
          name,
          description,
          advanced_task_definition,
          environment,
          project,
          command,
          service,
          created,
          deleted,
          }: {
            id: number,
            type:string,
            name: string,
            description: string,
            advanced_task_definition: number,
            environment: number,
            project: number,
            command: string,
            service: string,
            created: string,
            deleted: string,
          }) =>
          knex('task_registration')
            .insert({
              id,
              type,
              name,
              description,
              advanced_task_definition,
              environment,
              project,
              command,
              service,
              created,
              deleted,
            })
          .toString(),
    selectAdvancedTaskDefinitionEnvironmentLinkById: (id: number) =>
          knex('advanced_task_definition_environment')
            .where('advanced_task_definition_environment.id', '=', id)
          .toString(),
    selectTaskRegistrationById: (id: number) =>
          knex('task_registration')
            .where('task_registration.id', '=', id)
          .toString(),
  selectAdvancedTaskDefinition:(id: number) =>
    knex('advanced_task_definition')
      .where('advanced_task_definition.id', '=', id)
      .toString(),
  selectAdvancedTaskDefinitionArguments:(id: number) =>
      knex('advanced_task_definition_argument')
        .where('advanced_task_definition_argument.advanced_task_definition', '=', id)
        .toString(),
  selectAdvancedTaskDefinitionArgumentById:(id: number) =>
      knex('advanced_task_definition_argument')
        .where('advanced_task_definition_argument.id', '=', id)
        .toString(),
  selectAdvancedTaskDefinitionByName:(name: string) =>
    knex('advanced_task_definition')
      .where('advanced_task_definition.name', '=', name)
      .toString(),
  selectAdvancedTaskDefinitions:() =>
    knex('advanced_task_definition')
    .toString(),
};
