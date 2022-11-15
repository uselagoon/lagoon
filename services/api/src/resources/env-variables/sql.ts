import { knex } from '../../util/db';

export const Sql = {
  selectEnvVariable: (id: number) =>
    knex('env_vars')
      .select('id', 'name', 'value', 'scope')
      .where('id', '=', id)
      .toString(),
  insertEnvVariable: ({
    id,
    name,
    value,
    scope,
    project,
    environment,
  }: {
    id?: number,
    name: string,
    value: string,
    scope: string,
    project?: number,
    environment?: number,
  }) =>
    knex('env_vars')
      .insert({
        id,
        name,
        value,
        scope,
        project,
        environment,
      })
      .toString(),
  deleteEnvVariable: (id: number) =>
    knex('env_vars')
      .where('id', id)
      .del()
      .toString(),
  selectEnvironmentByNameAndProject: (name: string, projectId: number) =>
    knex('environment')
      .where('name', '=', name)
      .andWhere('project', '=', projectId)
      .andWhere('deleted', '0000-00-00 00:00:00')
      .toString(),
  selectEnvVarByNameAndProjectId: (name: string, projectId: number) =>
    knex('env_vars')
      .select('env_vars.*')
      .leftJoin('project', 'env_vars.project', '=', 'project.id')
      .where('env_vars.name', '=', name)
      .andWhere('env_vars.project', '=', projectId)
      .toString(),
  selectEnvVarByNameAndEnvironmentId: (name: string,  environmentId: number) =>
    knex('env_vars')
      .select('env_vars.*')
      .leftJoin('environment', 'env_vars.environment', '=', 'environment.id')
      .where('env_vars.name', '=', name)
      .andWhere('env_vars.environment', '=', environmentId)
      .toString(),
  selectEnvVarsByProjectId: (projectId: number) =>
    knex('env_vars')
      .select('env_vars.*')
      .leftJoin('project', 'env_vars.project', '=', 'project.id')
      .where('env_vars.project', '=', projectId)
      .orderBy('env_vars.name', 'asc')
      .toString(),
  selectEnvVarsByEnvironmentId: (environmentId: number) =>
    knex('env_vars')
      .select('env_vars.*')
      .leftJoin('environment', 'env_vars.environment', '=', 'environment.id')
      .where('env_vars.environment', '=', environmentId)
      .orderBy('env_vars.name', 'asc')
      .toString(),
  selectPermsForEnvVariable: (id: number) =>
    knex('env_vars')
      .select({ pid: 'project.id' })
      .leftJoin('environment', 'env_vars.environment', '=', 'environment.id')
      .leftJoin('project', function () {
        this
          .on('env_vars.project', '=', 'project.id')
          .orOn('environment.project', '=', 'project.id')
      })
      .where('env_vars.id', id)
      .toString(),
};
