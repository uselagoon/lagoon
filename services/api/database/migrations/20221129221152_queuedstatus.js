/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 exports.up = async function(knex) {
    return knex.schema
    .alterTable('deployment', function (table) {
        table.enu('status', ['new', 'pending', 'running', 'cancelled', 'error', 'failed', 'complete', 'queued']).notNullable();
    })
    .alterTable('task', function (table) {
        table.enu('status', ['new', 'pending', 'running', 'cancelled', 'error', 'failed', 'complete', 'queued']).notNullable();
    })
};

/**
* @param { import("knex").Knex } knex
* @returns { Promise<void> }
*/
exports.down = function(knex) {
    return knex.schema
    .alterTable('deployment', function (table) {
        table.enu('status', ['new', 'pending', 'running', 'cancelled', 'error', 'failed', 'complete']).notNullable();
    })
    .alterTable('task', function (table) {
        table.enu('status', ['new', 'pending', 'running', 'cancelled', 'error', 'failed', 'complete', 'active', 'succeeded']).notNullable();
    })
};
