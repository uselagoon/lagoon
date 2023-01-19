/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return knex.schema
    .alterTable('advanced_task_definition', (table) => {
        table.boolean('show_ui').notNullable().defaultTo(1);
        table.boolean('admin_task').notNullable().defaultTo(0);
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    return knex.schema
    .alterTable('advanced_task_definition', (table) => {
        table.dropColumn('show_ui');
        table.dropColumn('admin_task');
    })
};
