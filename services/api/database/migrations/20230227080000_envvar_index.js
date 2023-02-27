/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return knex.schema
    .alterTable('env_vars', (table) => {
        table.index('environment', 'environment_index');
        table.index('project', 'project_index');
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    return knex.schema
    .alterTable('env_vars', (table) => {
        table.dropIndex('environment', 'environment_index');
        table.dropIndex('project', 'project_index');
    })
};
