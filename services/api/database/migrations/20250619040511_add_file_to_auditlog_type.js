/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.
        raw(`ALTER TABLE audit_log MODIFY resource_type ENUM('backup', 'bulkdeployment', 'deployment', 'deploytarget', 'deploytargetconfig', 'environment', 'group', 'notification', 'organization', 'project', 'sshkey', 'task', 'user', 'variable', 'workflow', 'file');`).
        raw(`ALTER TABLE audit_log MODIFY linked_resource_type ENUM('backup', 'bulkdeployment', 'deployment', 'deploytarget', 'deploytargetconfig', 'environment', 'group', 'notification', 'organization', 'project', 'sshkey', 'task', 'user', 'variable', 'workflow', 'file');`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.
        raw(`ALTER TABLE audit_log MODIFY resource_type ENUM('backup', 'bulkdeployment', 'deployment', 'deploytarget', 'deploytargetconfig', 'environment', 'group', 'notification', 'organization', 'project', 'sshkey', 'task', 'user', 'variable', 'workflow');`).
        raw(`ALTER TABLE audit_log MODIFY linked_resource_type ENUM('backup', 'bulkdeployment', 'deployment', 'deploytarget', 'deploytargetconfig', 'environment', 'group', 'notification', 'organization', 'project', 'sshkey', 'task', 'user', 'variable', 'workflow');`);

};
