/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return knex.schema
    .createTable('project_clone', function (table) {
        table.increments('id').notNullable().primary();
        table.integer('source_project').notNullable();
        table.integer('destination_project').notNullable();
        table.string('status', 100).notNullable(); // is enum in API
        table.datetime('created').notNullable().defaultTo(knex.fn.now());
        table.datetime('updated');
        table.datetime('completed');
        table.index('environment', 'deployment_environment');
    })
    .createTable('project_clone_file', function (table) {
        table.integer('cid');
        table.integer('fid');
        table.primary(['cid', 'fid']);
    })
    .createTable('project_clone_task_deployments', function (table) {
        table.integer('cid');
        table.enu('type', ['task', 'deployment']).notNullable();
        table.integer('tdid');
        table.primary(['cid', 'tdid']);
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    return knex.schema
    .dropTable('project_clone')
    .dropTable('project_clone_file')
};