
exports.up = function (knex) {
    return knex.schema
        .alterTable('advanced_task_definition_argument', function (table) {
            table.string("range", 1000)
        })
        .raw(`ALTER TABLE advanced_task_definition_argument
    MODIFY type ENUM('NUMERIC', 'STRING', 'ENVIRONMENT_SOURCE_NAME', 'ENVIRONMENT_SOURCE_NAME_EXCLUDE_SELF', 'SELECT') NOT NULL;`);
};

exports.down = function (knex) {
    return knex.schema
        .alterTable('advanced_task_definition_argument', function (table) {
            table.dropColumn("range")
        })
        .raw(`ALTER TABLE advanced_task_definition_argument
    MODIFY type ENUM('NUMERIC', 'STRING', 'ENVIRONMENT_SOURCE_NAME', 'ENVIRONMENT_SOURCE_NAME_EXCLUDE_SELF') NOT NULL;`);
};
