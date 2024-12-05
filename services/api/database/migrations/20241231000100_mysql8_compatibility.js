/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return knex.schema
    .alterTable('advanced_task_definition', function (table) {
        table.specificType('description', 'text').notNullable().alter();
        table.string('group_name', 300).alter();
        table.specificType('command', 'text').alter();
        table.timestamp('deleted').notNullable().alter();
    })
    .alterTable('environment', function (table) {
        table.timestamp('deleted').notNullable().alter();
    })
    .alterTable('environment_fact', function (table) {
        table.specificType('description', 'text').alter();
        table.specificType('category', 'text').alter();
    })
    .alterTable('environment_problem', function (table) {
        table.string('identifier', 100).notNullable().alter();
        table.string('lagoon_service', 100).defaultTo('').alter();
        table.specificType('description', 'text').alter();
        table.string('version', 100).defaultTo('').alter();
        table.timestamp('deleted').notNullable().alter();
    })
    .alterTable('organization', function (table) {
        table.specificType('description', 'text').notNullable().alter();
    })
    .alterTable('s3_file', function (table) {
        table.timestamp('created').notNullable().defaultTo(knex.fn.now()).alter();
        table.timestamp('deleted').notNullable().alter();
    })
    .alterTable('workflow', function (table) {
        table.timestamp('deleted').notNullable().alter();
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    // caveats around this are that the rollback can only work while data is still saved in keycloak attributes
    // once we remove that duplication of attribute into keycloak, this rollback would result in data loss for group>project associations
    // for any group project associations made after the attribute removal
    return knex.schema
    .alterTable('advanced_task_definition', function (table) {
        table.specificType('description', 'text').defaultTo('').notNullable().alter();
        table.string('group_name', 300).alter();
        table.specificType('command', 'text').defaultTo('').alter();
    })
    .alterTable('environment_fact', function (table) {
        table.specificType('description', 'text').defaultTo('').alter();
        table.specificType('category', 'text').defaultTo('').alter();
    })
    .alterTable('environment_problem', function (table) {
        table.string('identifier', 100).notNullable().alter();
        table.string('lagoon_service', 100).defaultTo('').alter();
        table.specificType('description', 'text').defaultTo('').alter();
        table.string('version', 100).defaultTo('').alter();
    })
    .alterTable('project', function (table) {
        table.json('metadata').defaultTo('{}').alter();
    })
    .alterTable('s3_file', function (table) {
        table.datetime('created').notNullable().defaultTo(knex.fn.now()).alter();
        table.datetime('deleted').notNullable().alter();
    })
    .alterTable('organization', function (table) {
        table.specificType('description', 'text').notNullable().defaultTo('').alter();
    })
};
