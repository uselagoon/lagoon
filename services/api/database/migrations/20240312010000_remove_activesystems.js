/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
  .alterTable('project', (table) => {
    table.dropColumn('active_systems_deploy');
    table.dropColumn('active_systems_promote');
    table.dropColumn('active_systems_remove');
    table.dropColumn('active_systems_task');
    table.dropColumn('active_systems_misc');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
  .alterTable('project', (table) => {
    table.string('active_systems_deploy', 300);
    table.string('active_systems_promote', 300);
    table.string('active_systems_remove', 300);
    table.string('active_systems_task', 300);
    table.string('active_systems_misc', 300);
  });
};
