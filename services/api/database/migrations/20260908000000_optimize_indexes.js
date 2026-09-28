/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  return knex.schema
  .alterTable('environment_service', (table) => {
    table.index('environment')
  })
  .alterTable('project', (table) => {
    table.index('organization').index('git_url')
  })
  .alterTable('task', (table) => {
    table.index('task_name').index('remote_id')
  })
};

/**
* @param { import("knex").Knex } knex
* @returns { Promise<void> }
*/
exports.down = async function(knex) {
  return knex.schema
  .alterTable('environment_service', (table) => {
    table.dropIndex('environment')
  })
  .alterTable('project', (table) => {
    table.dropIndex('organization').dropIndex('git_url')
  })

  .alterTable('task', (table) => {
    table.dropIndex('task_name').dropIndex('remote_id');
  })
};
