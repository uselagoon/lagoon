/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
  .alterTable('env_vars', (table) => {
    table.datetime('updated').notNullable().defaultTo(knex.fn.now());
  })
  .raw("UPDATE env_vars SET updated='1970-01-01 00:00:00'");
  // Note, we do the above update so that all _existing_ env vars are
  // not picked up as needing to be deployed (since we're using 'updated' to track new/updated vars)
  // but any newly created items will get the _current_ date/time
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
return knex.schema
  .alterTable('env_vars', (table) => {
    table.dropColumn('updated');
  })
};
