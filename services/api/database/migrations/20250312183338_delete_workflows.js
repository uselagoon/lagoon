/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
        .raw(`DELETE FROM audit_log
            WHERE resource_type = 'workflow' OR linked_resource_type = 'workflow'`)
        .raw(`ALTER TABLE audit_log
            MODIFY resource_type ENUM('backup', 'bulkdeployment', 'deployment', 'deploytarget', 'deploytargetconfig', 'environment', 'group', 'notification', 'organization', 'project', 'sshkey', 'task', 'user', 'variable') NOT NULL;`)
        .raw(`ALTER TABLE audit_log
            MODIFY linked_resource_type ENUM('backup', 'bulkdeployment', 'deployment', 'deploytarget', 'deploytargetconfig', 'environment', 'group', 'notification', 'organization', 'project', 'sshkey', 'task', 'user', 'variable') NOT NULL;`)
        .dropTable('workflow');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema
    .raw(`ALTER TABLE audit_log
        MODIFY resource_type ENUM('backup', 'bulkdeployment', 'deployment', 'deploytarget', 'deploytargetconfig', 'environment', 'group', 'notification', 'organization', 'project', 'sshkey', 'task', 'user', 'variable', 'workflow') NOT NULL;`)
    .raw(`ALTER TABLE audit_log
        MODIFY linked_resource_type ENUM('backup', 'bulkdeployment', 'deployment', 'deploytarget', 'deploytargetconfig', 'environment', 'group', 'notification', 'organization', 'project', 'sshkey', 'task', 'user', 'variable', 'workflow') NOT NULL;`)
    .createTable('workflow', function (table) {
        table.increments('id').notNullable().primary();
        table.string('name', 50).notNullable();
        table.string('event', 300).notNullable();
        table.integer('project', 11).notNullable();
        table.integer('advanced_task_definition', 11).notNullable();
        table.timestamp('created').notNullable().defaultTo(knex.fn.now());
        table.timestamp('deleted').notNullable();
    });
};
