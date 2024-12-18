/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema
  .alterTable('env_vars', (table) => {
    table.integer('organization');
    table.unique(['name', 'organization'], {indexName: 'name_organization'});
    table.index('organization', 'organization_index');
  })
};

/**
* @param { import("knex").Knex } knex
* @returns { Promise<void> }
*/
exports.down = async function(knex) {
  return knex.schema
  .alterTable('env_vars', (table) => {
      table.dropColumn('organization');
  })
};
