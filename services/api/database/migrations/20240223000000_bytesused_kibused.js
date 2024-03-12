/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return knex.schema
    .alterTable('environment_storage', function (table) {
        table.renameColumn('bytes_used', 'kib_used');
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    return knex.schema
    .alterTable('environment_storage', function (table) {
        table.renameColumn('kib_used', 'bytes_used');
    })
};