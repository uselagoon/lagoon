/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return knex.schema
    .createTable('retention_policy', function (table) {
        table.increments('id').notNullable().primary();
        table.string('name', 300).unique({indexName: 'name'});
        table.enu('type',['harbor','history']).notNullable();
        table.text('configuration');
        table.timestamp('updated').notNullable().defaultTo(knex.fn.now());
        table.timestamp('created').notNullable().defaultTo(knex.fn.now());
    })
    .createTable('retention_policy_reference', function (table) {
        table.integer('retention_policy');
        table.enu('scope',['global','organization','project']).notNullable();
        table.integer('id');
        table.unique(['retention_policy', 'scope', 'id'], {indexName: 'organization_policy'});
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    return knex.schema
    .dropTable('retention_policy')
    .dropTable('retention_policy_reference')
};