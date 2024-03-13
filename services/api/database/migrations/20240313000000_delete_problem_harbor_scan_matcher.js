/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.dropTable('problem_harbor_scan_matcher');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.createTable('problem_harbor_scan_matcher', function (table) {
        table.increments('id').notNullable().primary();
        table.string('name', 100).notNullable();
        table.text('description');
        table.string('default_lagoon_project', 300);
        table.string('default_lagoon_environment', 300);
        table.string('default_lagoon_service_name', 300);
        table.string('regex', 300).notNullable();
    });
};
