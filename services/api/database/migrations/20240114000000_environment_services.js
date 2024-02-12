/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return knex.schema
    .alterTable('environment_service', function (table) {
        table.string('type', 300);
        table.timestamp('updated').notNullable().defaultTo(knex.fn.now());
        table.timestamp('created').notNullable().defaultTo(knex.fn.now());
        table.unique(['name', 'environment'], {indexName: 'service_environment'});
    })
    .createTable('environment_service_container', function (table) {
        table.integer('service_id');
        table.string('name', 300);
        table.unique(['service_id', 'name'], {indexName: 'service_container'});
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    return knex.schema
    .alterTable('environment_service', (table) => {
        table.dropColumn('type');
        table.dropColumn('updated');
        table.dropColumn('created');
    })
    .dropTable('environment_service_container')
};