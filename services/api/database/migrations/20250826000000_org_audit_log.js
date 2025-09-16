/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema
  .alterTable('audit_log', (table) => {
    table.integer('organization_id');
    table.index('organization_id', 'organization_index');
  })
};

/**
* @param { import("knex").Knex } knex
* @returns { Promise<void> }
*/
exports.down = async function(knex) {
  return knex.schema
  .alterTable('audit_log', (table) => {
    table.dropColumn('organization_id');
  })
};
