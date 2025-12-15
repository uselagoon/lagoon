/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
// Need to utilize raw here instead of alterTable as MySQL requires
// default values for JSON columns to be written as an expression
exports.up = async function(knex) {
  return knex.schema
    .raw(`UPDATE project SET metadata = '{}' WHERE metadata IS NULL;`)
    .raw(`ALTER TABLE project MODIFY metadata JSON NOT NULL DEFAULT ('{}');`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema
    .raw(`ALTER TABLE project MODIFY metadata JSON NULL;`)
    .raw(`UPDATE project SET metadata = NULL WHERE metadata = '{}';`);
};