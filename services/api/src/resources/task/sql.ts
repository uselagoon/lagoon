import { TaskSourceType } from '@lagoon/commons/dist/types';
import { knex } from '../../util/db';

export const Sql = {
  selectTask: (id: number) =>
    knex('task')
      .where('task.id', '=', id)
      .toString(),
  selectTaskByNameAndEnvironment: (name: string, environmentId: number) =>
    knex('task')
      .where('task_name', '=', name)
      .andWhere('environment', '=', environmentId)
      .toString(),
  insertTask: ({
    id,
    name,
    taskName,
    status,
    created,
    started,
    completed,
    environment,
    service,
    command,
    remoteId,
    deployTokenInjection,
    projectKeyInjection,
    adminOnlyView,
    type,
    advanced_image,
    advanced_payload,
    sourceUser,
    sourceType,
  }: {
    id: number;
    name: string;
    taskName: string,
    status: string;
    created: string;
    started: string;
    completed: string;
    environment: number;
    service: string;
    command: string;
    remoteId: string;
    deployTokenInjection: boolean;
    projectKeyInjection: boolean;
    adminOnlyView: boolean;
    type?: string;
    advanced_image?: string;
    advanced_payload?: string;
    sourceUser?: string;
    sourceType?: TaskSourceType;
  }) =>
    knex('task')
      .insert({
        id,
        name,
        taskName,
        status,
        created,
        started,
        completed,
        environment,
        service,
        command,
        deployTokenInjection,
        projectKeyInjection,
        adminOnlyView,
        remoteId,
        type: type ?? null,
        advanced_image: advanced_image ?? null,
        advanced_payload: advanced_payload ?? null,
        sourceUser: sourceUser ?? null,
        sourceType: sourceType ?? null,
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
      .select({ pid: 'environment.project', adminOnlyView: 'task.admin_only_view', deployTokenInjection: 'task.deploy_token_injection', projectKeyInjection: 'task.project_key_injection' })
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
    confirmation_text,
    deploy_token_injection,
    project_key_injection,
    admin_only_view,
    system_wide,
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
      confirmation_text: string,
      deploy_token_injection: boolean,
      project_key_injection: boolean,
      admin_only_view: boolean,
      system_wide: boolean,
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
        confirmation_text,
        deploy_token_injection,
        project_key_injection,
        admin_only_view,
        system_wide,
      })
    .toString(),
    insertAdvancedTaskDefinitionArgument: ({
      id,
      advanced_task_definition,
      name,
      type,
      displayName,
      defaultValue,
      optional,
      }: {
        id: number,
        advanced_task_definition: number,
        name: string,
        type: string,
        defaultValue: string,
        optional: boolean,
        displayName: string,
      }) =>
      knex('advanced_task_definition_argument')
        .insert({
          id,
          advanced_task_definition,
          name,
          type,
          defaultValue,
          optional,
          display_name: displayName
        })
      .toString(),
    updateAdvancedTaskDefinition: ({ id, patch }: { id: number; patch: { [key: string]: any } }) =>
     knex('advanced_task_definition')
       .where('id', id)
       .update(patch)
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
        // .select('advanced_task_definition.*', 'task_registration.id')
        .select(knex.raw(`advanced_task_definition.*, task_registration.id, advanced_task_definition.admin_only_view XOR 1 as "advanced_task_definition.show_ui", advanced_task_definition.deploy_token_injection as "advanced_task_definition.admin_task"`)) //use admin_only_view as show_ui for backwards compatability
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
        .select(knex.raw(`*, advanced_task_definition.admin_only_view XOR 1 as "show_ui", advanced_task_definition.deploy_token_injection as "admin_task"`)) //use admin_only_view as show_ui for backwards compatability
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
    deleteAdvancedTaskDefinitionArgumentByTaskDef:(advanced_task_definition: number) =>
      knex('advanced_task_definition_argument')
        .where('advanced_task_definition_argument.advanced_task_definition', '=', advanced_task_definition)
        .del()
        .toString(),
    selectAdvancedTaskDefinitionByName:(name: string) =>
      knex('advanced_task_definition')
      .select(knex.raw(`*, advanced_task_definition.admin_only_view XOR 1 as "show_ui", advanced_task_definition.deploy_token_injection as "admin_task"`)) //use admin_only_view as show_ui for backwards compatability
        .where('advanced_task_definition.name', '=', name)
        .toString(),
    selectAdvancedTaskDefinitionByNameProjectEnvironmentAndGroup:(name: string, project: number, environment: number, group: string, systemWide: boolean = false) => {
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
        if(systemWide == true) {
          query = query.where('advanced_task_definition.system_wide', '=', "1")
        }
        return query.toString()
    },
  selectAdvancedTaskDefinitions:() =>
    knex('advanced_task_definition')
    .select(knex.raw(`*, advanced_task_definition.admin_only_view XOR 1 as "show_ui", advanced_task_definition.deploy_token_injection as "admin_task"`)) //use admin_only_view as show_ui for backwards compatability
    .toString(),
  selectAdvancedTaskDefinitionsForEnvironment:(id: number) =>
    knex('advanced_task_definition')
    .select(knex.raw(`*, advanced_task_definition.admin_only_view XOR 1 as "show_ui", advanced_task_definition.deploy_token_injection as "admin_task"`)) //use admin_only_view as show_ui for backwards compatability
    .where('environment', '=', id)
    .toString(),
  selectAdvancedTaskDefinitionsForProject:(id: number) =>
    knex('advanced_task_definition')
    .select(knex.raw(`*, advanced_task_definition.admin_only_view XOR 1 as "show_ui", advanced_task_definition.deploy_token_injection as "admin_task"`)) //use admin_only_view as show_ui for backwards compatability
    .where('project', '=', id)
    .toString(),
  selectAdvancedTaskDefinitionsForGroups:(groups) =>
    knex('advanced_task_definition')
    .select(knex.raw(`*, advanced_task_definition.admin_only_view XOR 1 as "show_ui", advanced_task_definition.deploy_token_injection as "admin_task"`)) //use admin_only_view as show_ui for backwards compatability
    .where('group_name', 'in', groups)
    .toString(),
  selectAdvancedTaskDefinitionsForSystem:() =>
    knex('advanced_task_definition')
    .select(knex.raw(`*, advanced_task_definition.admin_only_view XOR 1 as "show_ui", advanced_task_definition.deploy_token_injection as "admin_task"`)) //use admin_only_view as show_ui for backwards compatability
    .where('environment','is', null)
    .andWhere('project','is', null)
    .andWhere('group_name','is', null)
    .andWhere('system_wide','=','1')
    .toString(),
  deleteAdvancedTaskDefinition:(id: number) =>
    knex('advanced_task_definition')
    .where('id', id)
    .del()
    .toString(),
  deleteAdvancedTaskDefinitionArgumentsForTask:(taskId: number) => knex('advanced_task_definition_argument')
    .where('advanced_task_definition', taskId)
    .del()
    .toString(),
  // this selects all tasks for the environment and returns everything outside of the requested retain value
  selectTaskHistoryRetention: (id: number, retain: number) =>
    knex.raw(`SELECT id, name, remote_id FROM task
      WHERE environment=`+id+` AND admin_only_view=0 AND id NOT IN (
        SELECT id
        FROM (
          SELECT id
          FROM task
          WHERE environment=`+id+` AND admin_only_view=0
          ORDER BY id DESC
          LIMIT `+retain+`
        ) t
      );`)
      .toString(),
  // this selects all tasks for the environment and returns everything outside of the requested retain days value
  selectTaskHistoryRetentionDays: (environment: number, retain: number) =>
    knex.raw(`SELECT id, name, remote_id FROM task WHERE environment=`+environment+` AND admin_only_view=0 AND created >= NOW() - INTERVAL `+retain+` DAY;`)
      .toString(),
  // this selects all tasks for the environment and returns everything outside of the requested retain months value
  selectTaskHistoryRetentionMonths: (environment: number, retain: number) =>
    knex.raw(`SELECT id, name, remote_id FROM task WHERE environment=`+environment+` AND admin_only_view=0 AND created >= NOW() - INTERVAL `+retain+` MONTH;`)
      .toString(),
  // this selects all tasks for the environment and returns everything
  selectTaskHistoryForEnvironment: (environment: number) =>
    knex.raw(`SELECT id, name, remote_id FROM task WHERE environment=`+environment+`;`)
      .toString(),
  // same as select, except it deletes all tasks for the environment outside of the requested retain value
  deleteTaskHistory: (environment: number, retain: number) =>
    knex.raw(`DELETE FROM task
      WHERE environment=`+environment+` AND admin_only_view=0 AND id NOT IN (
        SELECT id
        FROM (
          SELECT id
          FROM task
          WHERE environment=`+environment+` AND admin_only_view=0
          ORDER BY id DESC
          LIMIT `+retain+`
        ) t
      );`)
      .toString(),
  // same as select, except it deletes all tasks for the environment outside of the requested retain value
  deleteTaskHistoryDays: (environment: number, retain: number) =>
    knex.raw(`DELETE FROM task WHERE environment=`+environment+` AND admin_only_view=0 AND created >= NOW() - INTERVAL `+retain+` DAY;`)
      .toString(),
  // same as select, except it deletes all tasks for the environment outside of the requested retain value
  deleteTaskHistoryMonths: (environment: number, retain: number) =>
    knex.raw(`DELETE FROM task WHERE environment=`+environment+` AND admin_only_view=0 AND created >= NOW() - INTERVAL `+retain+` MONTH;`)
      .toString(),
  // same as select, except it deletes all tasks for the environment outside of the requested retain value
  deleteTaskHistoryForEnvironment: (environment: number) =>
    knex.raw(`DELETE FROM task WHERE environment=`+environment+`;`)
      .toString(),
};
