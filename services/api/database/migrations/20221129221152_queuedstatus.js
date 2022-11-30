/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 exports.up = async function(knex) {
    return knex.schema
    .alterTable('deployment', (table) => {
        table.string('build_step');
    })
    .raw(`ALTER TABLE task
    MODIFY status ENUM("new", "pending", "running", "cancelled", "error", "failed", "complete", "active", "succeeded", "queued") NOT NULL;`)
    .raw(`ALTER TABLE deployment
    MODIFY status ENUM("new", "pending", "running", "cancelled", "error", "failed", "complete", "queued") NOT NULL;`)
};

/**
* @param { import("knex").Knex } knex
* @returns { Promise<void> }
*/
exports.down = async function(knex) {
    // cant alter enums in place, so drop the column first :D
    return knex.schema
    .alterTable('deployment', (table) => {
        table.dropColumn('build_step');
    })
    .raw(`ALTER TABLE task
    MODIFY status ENUM("new", "pending", "running", "cancelled", "error", "failed", "complete", "active", "succeeded", "queued") NOT NULL;`)
    .raw(`ALTER TABLE deployment
    MODIFY status ENUM("new", "pending", "running", "cancelled", "error", "failed", "complete", "queued") NOT NULL;`)
};
