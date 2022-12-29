/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    organizations = await knex.schema.hasTable('organization');
    if (!organizations) {
        return knex.schema
        .createTable('organization', function (table) {
            table.increments('id').notNullable().primary();
            table.string('name', 300).notNullable();
            table.specificType('description', 'text').defaultTo('').notNullable();
            table.integer('quota_project', 1).notNullable();
        })
        .createTable('organization_deploy_target', function (table) {
            table.integer('orgid');
            table.integer('dtid');
            table.primary(['orgid', 'dtid']);
        })
        .alterTable('notification_email', function (table) {
            table.integer('organization');
        })
        .alterTable('notification_microsoftteams', function (table) {
            table.integer('organization');
        })
        .alterTable('notification_rocketchat', function (table) {
            table.integer('organization');
        })
        .alterTable('notification_slack', function (table) {
            table.integer('organization');
        })
        .alterTable('notification_webhook', function (table) {
            table.integer('organization');
        })
        .alterTable('project', function (table) {
            table.integer('organization');
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