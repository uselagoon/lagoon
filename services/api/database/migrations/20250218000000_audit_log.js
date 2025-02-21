/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    organizations = await knex.schema.hasTable('audit_log');
    if (!organizations) {
        return knex.schema
        .createTable('audit_log', function (table) {
            table.increments('id').notNullable().primary();
            table.specificType('usid', 'CHAR(36)'); // will be uuid from keycloak
            table.string('email_address', 300);
            table.specificType('resource_id', 'CHAR(36)'); // could be uuid (group/user) or int (project/env/org)
            table.enu('resource_type', ['backup', 'bulkdeployment', 'deployment', 'deploytarget', 'deploytargetconfig', 'environment', 'group', 'notification', 'organization', 'project', 'sshkey', 'task', 'user', 'variable','workflow']);
            table.string('resource_details', 300);
            table.specificType('linked_resource_id', 'CHAR(36)'); // could be uuid (group/user) or int (project/env/org)
            table.enu('linked_resource_type', ['backup', 'bulkdeployment', 'deployment', 'deploytarget', 'deploytargetconfig', 'environment', 'group', 'notification', 'organization', 'project', 'sshkey', 'task', 'user', 'variable','workflow']);
            table.string('linked_resource_details', 300);
            table.string('audit_event', 300);
            table.specificType('impersonator_id', 'CHAR(36)'); // will be uuid from keycloak
            table.string('impersonator_username', 300);
            table.string('ip_address', 300);
            table.enu('source', ['api','cli','ui']);
            table.datetime('created').notNullable().defaultTo(knex.fn.now());
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
