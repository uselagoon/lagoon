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
    remoteId,
    type = null,
    advanced_image = null,
    advanced_payload = null,
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
    type?: string;
    advanced_image?: string;
    advanced_payload?: string;
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
      .toString(),
  insertAdvancedTaskDefinition: ({
    id,
    name,
    description,
    image,
    command,
    created,
    type,
    service,
    project,
    group_name,
    environment,
    permission,
    }: {
      id: number,
      name: string,
      description: string,
      image: string,
      command: string,
      created: string,
      type: string,
      service: string,
      project: number,
      group_name: string,
      environment: number,
      permission: string,
    }) =>
    knex('advanced_task_definition')
      .insert({
        id,
        name,
        description,
        image,
        command,
        created,
        type,
        service,
        project,
        group_name,
        environment,
        permission,
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
    selectAdvancedTaskDefinitionEnvironmentLinkById: (id: number) =>
          knex('task_registration')
            .where('task_registration.id', '=', id)
          .toString(),
    selectTaskRegistrationById: (id: number) =>
      knex('task_registration')
        .where('task_registration.id', '=', id)
        .toString(),
    selectTaskRegistrationsByEnvironmentId:(id: number) =>
      knex('advanced_task_definition')
        .select('advanced_task_definition.*', 'task_registration.id')
        .join('task_registration', 'task_registration.advanced_task_definition', '=', 'advanced_task_definition.id')
        .where('task_registration.environment', '=', id)
        .toString(),
    selectTaskRegistrationByEnvironmentIdAndAdvancedTaskId: (environmentId: number, task: number) =>
      knex('task_registration')
        .where('task_registration.environment', '=', environmentId)
        .where('task_registration.advanced_task_definition', '=', task)
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
    selectAdvancedTaskDefinitionByNameProjectEnvironmentAndGroup:(name: string, project: number, environment: number, group: string) => {
      let query = knex('advanced_task_definition')
        .where('advanced_task_definition.name', '=', name);
        if(project) {
          query = query.where('advanced_task_definition.project', '=', project)
        }
        if(environment) {
          query = query.where('advanced_task_definition.environment', '=', environment)
        }
        if(group) {
          query = query.where('advanced_task_definition.group_name', '=', group)
        }
        return query.toString()
    },
  selectAdvancedTaskDefinitions:() =>
    knex('advanced_task_definition')
    .toString(),
  selectAdvancedTaskDefinitionsForEnvironment:(id: number) =>
    knex('advanced_task_definition')
    .where('environment', '=', id)
    .toString(),
  selectAdvancedTaskDefinitionsForProject:(id: number) =>
    knex('advanced_task_definition')
    .where('project', '=', id)
    .toString(),
  selectAdvancedTaskDefinitionsForGroups:(groups) =>
    knex('advanced_task_definition')
    .where('group_name', 'in', groups)
    .toString(),
  deleteAdvancedTaskDefinition:(id: number) =>
  knex('advanced_task_definition')
  .where('id', id)
  .del()
  .toString(),
};
