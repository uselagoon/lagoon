/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema.alterTable('environment', (table) => {
    table.index(['openshift_project_name', 'deleted'], 'openshift_project_name_deleted');
  })
};

/**
* @param { import("knex").Knex } knex
* @returns { Promise<void> }
*/
exports.down = async function(knex) {
  return knex.schema.alterTable('environment', (table) => {
    table.dropIndex(['openshift_project_name', 'deleted'], 'openshift_project_name_deleted');
  })
};
