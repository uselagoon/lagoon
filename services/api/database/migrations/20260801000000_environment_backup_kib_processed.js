/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return knex.schema.alterTable('environment_backup', function (table) {
        table.bigInteger('kib_processed');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    return knex.schema.alterTable('environment_backup', (table) => {
        table.dropColumn('kib_processed');
    });
};
