/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return knex.schema
    .createTable('organization_key', function (table) {
        table.increments('id').notNullable().primary();
        table.integer('organization').notNullable();
        table.string('name', 100).notNullable();
        table.string('comment', 500);
        table.string('private_key', 5000);
        table.timestamp('created').notNullable().defaultTo(knex.fn.now());
        table.unique(['organization', 'name'], {indexName: 'organization_key_name'});
    })
    .alterTable('organization', function (table) {
        table.integer('quota_keys').defaultTo(10).notNullable();
    })
    .alterTable('project', (table) => {
        table.integer('organization_key');
    })
    .raw(`ALTER TABLE audit_log MODIFY resource_type ENUM('backup', 'bulkdeployment', 'deployment', 'deploytarget', 'deploytargetconfig', 'environment', 'group', 'notification', 'organization', 'project', 'sshkey', 'task', 'user', 'variable', 'workflow', 'file', 'deploykey');`)
    .raw(`ALTER TABLE audit_log MODIFY linked_resource_type ENUM('backup', 'bulkdeployment', 'deployment', 'deploytarget', 'deploytargetconfig', 'environment', 'group', 'notification', 'organization', 'project', 'sshkey', 'task', 'user', 'variable', 'workflow', 'file', 'deploykey');`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    return knex.schema
    .dropTable('organization_key')
    .alterTable('organization', (table) => {
        table.dropColumn('quota_keys');
    })
    .alterTable('project', (table) => {
        table.dropColumn('organization_key');
    })
    .raw(`ALTER TABLE audit_log MODIFY resource_type ENUM('backup', 'bulkdeployment', 'deployment', 'deploytarget', 'deploytargetconfig', 'environment', 'group', 'notification', 'organization', 'project', 'sshkey', 'task', 'user', 'variable', 'workflow', 'file');`)
    .raw(`ALTER TABLE audit_log MODIFY linked_resource_type ENUM('backup', 'bulkdeployment', 'deployment', 'deploytarget', 'deploytargetconfig', 'environment', 'group', 'notification', 'organization', 'project', 'sshkey', 'task', 'user', 'variable', 'workflow', 'file');`);
};
