/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return knex.schema
    .alterTable('environment', (table) => {
        table.string('idle_state').notNullable().defaultTo('active');
    })
    .alterTable('environment_service', function (table) {
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
        table.dropColumn('idle_state');
    })
    .alterTable('environment_service', (table) => {
        table.dropColumn('replicas');
    })
};
