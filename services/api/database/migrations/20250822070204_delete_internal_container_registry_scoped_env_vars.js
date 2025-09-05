/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
      .raw(`DELETE FROM env_vars WHERE scope = 'internal_container_registry'`)
      .raw(`ALTER TABLE env_vars
        MODIFY scope ENUM('global', 'build', 'runtime', 'container_registry') NOT NULL DEFAULT 'global';`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
      .raw(`ALTER TABLE env_vars
        MODIFY scope ENUM('global', 'build', 'runtime', 'container_registry', 'internal_container_registry') NOT NULL DEFAULT 'global';`);
};