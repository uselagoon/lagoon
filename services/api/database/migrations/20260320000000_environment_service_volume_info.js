/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return knex.schema
    .alterTable('environment_service', function (table) {
        table.boolean('abandoned').notNullable().defaultTo(0); // default to false
    })
    .createTable('environment_volume', function (table) {
        table.increments('id').notNullable().primary();
        table.integer('environment').notNullable();
        table.string('name', 100).notNullable();
        table.string('storage_type', 100);
        table.string('type', 100);
        table.bigInteger('kib_requested');
        table.timestamp('created').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated').notNullable().defaultTo(knex.fn.now());
        table.boolean('abandoned').notNullable().defaultTo(0); // default to false
        table.unique(['environment', 'name'], {indexName: 'environment_volume'});
    })
    .createTable('environment_service_container_volumemount', function (table) {
        table.integer('service_id');
        table.string('container_name', 300);
        table.string('name', 300).notNullable();
        table.string('path', 300).notNullable();
        table.unique(['service_id', 'container_name', 'name'], {indexName: 'container_volumemount'});
    })
    .createTable('environment_service_container_port', function (table) {
        table.integer('service_id');
        table.string('container_name', 300);
        table.string('name', 300).notNullable();
        table.integer('port').notNullable();
        table.unique(['service_id', 'container_name', 'name'], {indexName: 'container_port'});
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
        table.dropUnique(['name', 'environment'], 'service_environment');
    })
    .dropTable('environment_service_container')
};