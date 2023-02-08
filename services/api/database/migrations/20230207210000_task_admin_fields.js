/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return knex.schema
    .alterTable('task', (table) => {
        table.boolean('admin_only_view').notNullable().defaultTo(0);
        table.boolean('deploy_token_injection').notNullable().defaultTo(0);
        table.boolean('project_key_injection').notNullable().defaultTo(0);
    })
    .alterTable('advanced_task_definition', (table) => {
        table.boolean('admin_only_view').notNullable().defaultTo(0);
        table.boolean('deploy_token_injection').notNullable().defaultTo(0);
        table.boolean('project_key_injection').notNullable().defaultTo(0);
    })
    .raw(`UPDATE advanced_task_definition atd SET atd.admin_only_view = atd.show_ui XOR 1;`) // invert show_ui to admin_only_view
    .raw(`UPDATE advanced_task_definition atd SET atd.deploy_token_injection = atd.admin_task, atd.project_key_injection = atd.admin_task;`) // turn admin_task into deploy_token and project_key
    .alterTable('advanced_task_definition', (table) => {
        table.dropColumn('show_ui');
        table.dropColumn('admin_task');
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    return knex.schema
    .alterTable('task', (table) => {
        table.dropColumn('admin_only_view');
        table.dropColumn('deploy_token_injection');
        table.dropColumn('project_key_injection');
    })
    .alterTable('advanced_task_definition', (table) => {
        table.boolean('show_ui').notNullable().defaultTo(1);
        table.boolean('admin_task').notNullable().defaultTo(0);
    })
    .raw(`UPDATE advanced_task_definition atd SET atd.show_ui = atd.admin_only_view XOR 1;`) // invert admin_only_view to show_ui
    .raw(`UPDATE advanced_task_definition atd SET atd.admin_task = atd.deploy_token_injection;`) // revert deploy_token to admin_task
    .alterTable('advanced_task_definition', (table) => {
        table.dropColumn('admin_only_view');
        table.dropColumn('deploy_token_injection');
        table.dropColumn('project_key_injection');
    })
};
