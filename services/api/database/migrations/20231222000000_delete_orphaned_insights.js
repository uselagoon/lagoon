/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return Promise.all([
      knex.schema.raw(`
       DELETE ef
       FROM environment_fact ef
       LEFT JOIN environment e ON ef.environment = e.id
       WHERE e.id IS NULL OR e.deleted != '0000-00-00 00:00:00'
      `),
      knex.schema.raw(`
       DELETE ep
       FROM environment_problem ep
       LEFT JOIN environment e ON ep.environment = e.id
       WHERE e.id IS NULL OR e.deleted != '0000-00-00 00:00:00'
      `),
]);
  };

  /**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
  exports.down = function(knex) {
    return knex.schema;
  };
