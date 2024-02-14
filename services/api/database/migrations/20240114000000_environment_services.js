/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return knex.schema
    .raw(`DELETE es1 FROM environment_service es1 INNER JOIN environment_service es2  WHERE  es1.id < es2.id AND es1.name = es2.name;`)
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
        table.dropUnique(['name', 'environment'], 'service_environment');
    })
    .dropTable('environment_service_container')
};