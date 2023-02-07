/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return knex.schema
    .alterTable('task', (table) => {
        table.boolean('admin_task').notNullable().defaultTo(0);
        table.boolean('admin_only_view').notNullable().defaultTo(0);
    })
    .alterTable('advanced_task_definition', (table) => {
        table.dropColumn('show_ui');
        table.boolean('admin_only_view').notNullable().defaultTo(0);
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    return knex.schema
    .alterTable('task', (table) => {
        table.dropColumn('admin_task');
        table.dropColumn('admin_only_view');
    })
    .alterTable('advanced_task_definition', (table) => {
        table.dropColumn('admin_only_view');
    })
};
