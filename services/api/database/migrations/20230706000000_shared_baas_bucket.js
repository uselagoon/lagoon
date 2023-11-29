/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return knex.schema
    .alterTable('openshift', (table) => {
        table.string('shared_baas_bucket_name', 300);
    })
    .alterTable('project', (table) => {
        table.boolean('shared_baas_bucket').notNullable().defaultTo(1); // defaults all new projects to use the shared baas bucket
    })
    .raw(`UPDATE project SET shared_baas_bucket=0;`) // update existing projects already deployed to retain their project specific buckets
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    return knex.schema
    .alterTable('project', (table) => {
        table.dropColumn('shared_baas_bucket');
    })
    .alterTable('openshift', (table) => {
        table.dropColumn('shared_baas_bucket_name');
    })
};
