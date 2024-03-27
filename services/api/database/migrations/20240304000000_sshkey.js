/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return knex.schema.table('ssh_key', (table) => {
        table.string('key_type_new').notNullable().defaultTo('ssh-rsa');
    }).then(() => {
        return knex('ssh_key').update({
            key_type_new: knex.ref('key_type')
        });
    }).then(function () {
        return knex.schema.table('ssh_key', (table) => {
            table.dropColumn('key_type');
            table.renameColumn('key_type_new', 'key_type');
        })
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
    return knex.schema.table('ssh_key', (table) => {
        table.enu('key_type_new', ['ssh-rsa', 'ssh-ed25519','ecdsa-sha2-nistp256','ecdsa-sha2-nistp384','ecdsa-sha2-nistp521']).notNullable().defaultTo('ssh-rsa');
    }).then(() => {
        return knex('ssh_key')
        .whereNotIn('key_type', ['ssh-rsa', 'ssh-ed25519','ecdsa-sha2-nistp256','ecdsa-sha2-nistp384','ecdsa-sha2-nistp521'])
        .del();
    }).then(function () {
        return knex('ssh_key').update({
            key_type_new: knex.ref('key_type')
        });
    }).then(function () {
        return knex.schema.table('ssh_key', (table) => {
            table.dropColumn('key_type');
            table.renameColumn('key_type_new', 'key_type');
        })
    });
};
