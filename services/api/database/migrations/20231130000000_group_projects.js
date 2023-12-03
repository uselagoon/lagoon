/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    group_projects = await knex.schema.hasTable('group_projects');
    if (!group_projects) {
        return knex.schema
        // this table holds the main group to organization id association
        .createTable('group_organization', function (table) {
            table.increments('id').notNullable().primary();
            table.string('group_id', 50).notNullable();
            table.integer('organization_id').notNullable();
            table.unique(['group_id', 'organization_id'], {indexName: 'group_organization'});
        })
        // this table holds the main group to organization id association
        .createTable('group_projects', function (table) {
            table.increments('id').notNullable().primary();
            table.string('group_id', 50).notNullable();
            table.integer('project_id').notNullable();
            table.unique(['group_id', 'project_id'], {indexName: 'group_project'});
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
