/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    organizations = await knex.schema.hasTable('user');
    if (!organizations) {
        return knex.schema
        .createTable('user', function (table) {
            table.specificType('usid', 'CHAR(36)');
            table.datetime('last_accessed');
            table.primary(['usid']);
        })
    }
    else {
        return knex.schema
    }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    return knex.schema
};
