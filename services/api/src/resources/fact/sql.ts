import { KnownDirectives } from 'graphql/validation/rules/KnownDirectives';
import { knex } from '../../util/db';

const standardFactReturn = {
    id: 'f.id',
    environment: 'environment',
    name: 'f.name',
    value: 'value',
    source: 'source',
    description: 'description',
    type: 'type',
    category: 'category',
    keyFact: 'keyFact'
};

export const Sql = {
  selectFactByDatabaseId: (fid: number) =>
    knex('environment_fact as f')
      .select(standardFactReturn)
      .leftJoin('environment_fact_reference as r', 'r.fid', '=', 'f.id')
      .where('f.id', fid)
      .toString(),
  selectFactsByEnvironmentId: ({ environmentId }) =>
    knex('environment_fact as f')
      .select(standardFactReturn)
      .leftJoin('environment_fact_reference as r', 'r.fid', '=', 'f.id')
      .where('environment', environmentId)
      .toString(),
  insertFact: ({ environment, name, value, source, description, type, category, keyFact }) =>
    knex('environment_fact').insert({ environment, name, value, source, description, type, category, keyFact }).toString(),
  deleteFact: (environment, name) =>
    knex('environment_fact')
      .where({
        environment,
        name
      })
      .del()
      .toString(),
  deleteFactsFromSource: (environment, source) =>
    knex('environment_fact')
      .where({ environment, source })
      .del()
      .toString(),
  selectFactReferenceByDatabaseId: (id: number) =>
    knex('environment_fact_reference')
      .where({ id })
      .toString(),
  selectFactReferencesByFactId: (fid: number) =>
    knex('environment_fact_reference')
      .where('fid', '=', fid)
      .toString(),
  insertFactReference: ({ eid, fid, name }) =>
      knex('environment_fact_reference')
        .insert({ eid, fid, name }).toString(),
  deleteFactReferenceByDatabaseId: (id) =>
    knex('environment_fact_reference')
      .where({ id })
      .del()
      .toString(),
  deleteFactReferencesByFactId: (fid) =>
    knex('environment_fact_reference')
      .where({ fid })
      .del()
      .toString(),
};
