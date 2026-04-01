/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return knex.schema
    .alterTable('project', (table) => {
        table.integer('clone');
        table.text('restrictions'); // is enum slice in API
    })
    .createTable('project_clone', function (table) {
        table.increments('id').notNullable().primary();
        table.integer('source_project').notNullable();
        table.integer('destination_project').notNullable();
        table.string('status', 100).notNullable(); // is enum in API
        table.datetime('created').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated').notNullable().defaultTo(knex.fn.now());
        table.datetime('completed');
        table.index('destination_project', 'projectclone_source');
    })
    .createTable('project_clone_task_deployments', function (table) {
        table.integer('cid');
        table.enu('project', ['source', 'destination']).notNullable();
        table.enu('type', ['task', 'deployment']).notNullable();
        table.integer('pid');
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
    .alterTable('project', (table) => {
        table.dropColumn('clone');
        table.dropColumn('restrictions');
    })
    .dropTable('project_clone')
    .dropTable('project_clone_task_deployments')
};