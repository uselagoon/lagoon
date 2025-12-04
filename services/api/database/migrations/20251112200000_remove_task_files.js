/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
  .dropTable('s3_file')
  .dropTable('task_file')
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
return knex.schema
  .createTable('s3_file', function (table) {
      table.increments('id').notNullable().primary();
      table.string('filename', 100).notNullable();
      table.text('s3_key').notNullable();
      table.timestamp('created').notNullable().defaultTo(knex.fn.now());
      table.timestamp('deleted').notNullable();
  })
  .createTable('task_file', function (table) {
      table.integer('tid');
      table.integer('fid');
      table.primary(['tid', 'fid']);
  })
};
