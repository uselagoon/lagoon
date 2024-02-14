/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return knex.schema
    .alterTable('task', function (table) {
        table.enu('source_type', ['api']);
        table.string('source_user', 300);
    })
    .alterTable('deployment', function (table) {
        table.enu('source_type', ['api', 'webhook']);
        table.string('source_user', 300);
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    return knex.schema
    .alterTable('task', (table) => {
        table.dropColumn('source_type');
        table.dropColumn('source_user');
    })
    .alterTable('deployment', (table) => {
        table.dropColumn('source_type');
        table.dropColumn('source_user');
    })
};