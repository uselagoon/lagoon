/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return knex.schema
    .alterTable('advanced_task_definition_argument', (table) => {
        table.text('default_value');
        table.boolean('optional').notNullable().defaultTo(0);
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    return knex.schema
    .alterTable('advanced_task_definition_argument', (table) => {
        table.dropColumn('default_value');
        table.dropColumn('optional');
    })
};
