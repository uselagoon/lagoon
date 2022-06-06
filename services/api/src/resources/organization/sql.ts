import { knex } from '../../util/db';

export const Sql = {
  insertOrganization: ({
    id,
    name,
    description,
    quotaProject,
  }: {
    id?: number;
    name: string;
    description: string;
    quotaProject?: number;
  }) =>
    knex('organization')
      .insert({
        id,
        name,
        description,
        quotaProject
      })
      .toString(),
  updateOrganization: ({
    id,
    patch
  }: {
    id: number;
    patch: { [key: string]: any };
  }) =>
    knex('organization')
      .where('id', '=', id)
      .update(patch)
      .toString(),
  selectOrganization: (id: number) =>
    knex('organization')
      .where('id', '=', id)
      .toString()
};
