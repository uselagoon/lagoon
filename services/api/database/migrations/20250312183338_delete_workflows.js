/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.dropTable('workflow');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.createTable('workflow', function (table) {
        table.increments('id').notNullable().primary();
        table.string('name', 50).notNullable();
        table.string('event', 300).notNullable();
        table.integer('project', 11).notNullable();
        table.integer('advanced_task_definition', 11).notNullable();
        table.timestamp('created').notNullable().defaultTo(knex.fn.now());
        table.timestamp('deleted').notNullable();
    });
};
