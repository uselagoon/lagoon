/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 exports.up = async function(knex) {
    // cant alter enums in place, so drop the column first :D
    buildStep = await knex.schema.hasColumn('deployment', 'build_step');
    if (!buildStep) {
        return knex.schema
        .alterTable('deployment', (table) => {
            table.dropColumn('status');
            table.string('build_step');
        })
        .alterTable('task', (table) => {
            table.dropColumn('status');
        })
        .alterTable('deployment', function (table) {
            table.enu('status', ['new', 'pending', 'running', 'cancelled', 'error', 'failed', 'complete', 'queued']).notNullable();
        })
        .alterTable('task', function (table) {
            table.enu('status', ['new', 'pending', 'running', 'cancelled', 'error', 'failed', 'complete', 'queued']).notNullable();
        })
    }
    else {
        return knex.schema
    }
};

/**
* @param { import("knex").Knex } knex
* @returns { Promise<void> }
*/
exports.down = async function(knex) {
    // cant alter enums in place, so drop the column first :D
    return knex.schema
    .alterTable('deployment', (table) => {
        table.dropColumn('status');
        table.dropColumn('build_step');
    })
    .alterTable('task', (table) => {
        table.dropColumn('status');
    })
    .alterTable('deployment', function (table) {
        table.enu('status', ['new', 'pending', 'running', 'cancelled', 'error', 'failed', 'complete']).notNullable();
    })
    .alterTable('task', function (table) {
        table.enu('status', ['new', 'pending', 'running', 'cancelled', 'error', 'failed', 'complete', 'active', 'succeeded']).notNullable();
    })
};
