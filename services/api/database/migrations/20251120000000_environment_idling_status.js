/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return knex.schema
    .alterTable('environment', (table) => {
        table.boolean('idled').notNullable().defaultTo(0);
    })
    .alterTable('environment_service', function (table) {
        table.enu('status', ['stopped', 'running']);
        table.integer('replicas').notNullable().defaultTo(0);
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    return knex.schema
    .alterTable('environment', (table) => {
        table.dropColumn('idled');
    })
    .alterTable('environment_service', (table) => {
        table.dropColumn('status');
        table.dropColumn('replicas');
    })
};
