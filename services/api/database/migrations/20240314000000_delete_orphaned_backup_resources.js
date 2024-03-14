/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  // remove any deleted environment backups that are flagged as deleted
  // or where the environment/project are deleted or no longer exist
  return knex.schema
    .raw(`DELETE eb
      FROM environment_backup eb
      LEFT JOIN environment e ON eb.environment = e.id
      WHERE eb.deleted != '0000-00-00 00:00:00' OR e.id IS NULL OR e.deleted != '0000-00-00 00:00:00' OR e.project NOT IN (SELECT id FROM project)
    `)
    // drop the deleted column
    .alterTable('environment_backup', (table) => {
      table.dropColumn('deleted');
    });
  };

  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    return knex.schema
    .alterTable('environment_backup', (table) => {
        table.timestamp('deleted').notNullable().defaultTo('0000-00-00 00:00:00');
    });
  };
