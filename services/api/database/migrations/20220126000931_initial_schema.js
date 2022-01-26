//table.string('', 5000).notNullable();

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
    .createTable('ssh_key', function (table) {
       table.increments('id').primary();
       table.string('name', 100).notNullable();
       table.string('key_value', 5000).notNullable();
       table.enu('key_type', ['ssh-rsa', 'ssh-ed25519']).notNullable().defaultTo('ssh-rsa');
       //table.string('key_value', 51).notNullable().unique(); //TODO - this is a char, not varchar, in current schema
       table.dateTime('created').notNullable().defaultTo(knex.fn.now());
    })
    .createTable('user', function (table) {
       table.increments('id').primary();
       table.string('email', 100).notNullable().unique();
       table.string('first_name', 50).notNullable();
       table.string('last_name', 50).notNullable();
       table.text('comment');
       table.integer('gitlab_id');
    })
    .createTable('customer', function (table) {
        table.increments('id').primary();
        table.string('name', 50).notNullable().unique();
        table.text('comment', 50);
        table.dateTime('created').notNullable().defaultTo(knex.fn.now());
    })
    .createTable('openshift', function (table) {
        table.increments('id').primary();
        table.string('name', 50).notNullable().unique();
        table.string('console_url', 300);
        table.string('token', 2000);
        table.string('router_pattern', 300);
        table.string('project_user', 100);
        table.string('ssh_host', 300);
        table.string('ssh_port', 50);
        table.string('monitoring_config', 2048);
        table.dateTime('created').notNullable().defaultTo(knex.fn.now());
    })
    .createTable('notification_microsoftteams', function (table) {
        table.increments('id').primary();
        table.string('name', 50).notNullable().unique();
        table.string('webhook', 512);
    })
    .createTable('notification_rocketchat', function (table) {
        table.increments('id').primary();
        table.string('name', 50).notNullable().unique();
        table.string('webhook', 300);
        table.string('channel', 300);
    })
    .createTable('notification_slack', function (table) {
        table.increments('id').primary();
        table.string('name', 50).notNullable().unique();
        table.string('webhook', 300);
        table.string('channel', 300);
    })
    .createTable('notification_email', function (table) {
        table.increments('id').primary();
        table.string('name', 50).notNullable().unique();
        table.string('email_address', 300);
    })
    .createTable('project', function (table) {
        table.increments('id').primary();
        table.string('name', 100).notNullable().unique();
        table.integer('customer').references('customer.id'); //TODO: double check types
        table.string('git_url', 300);
        table.string('availability').defaultTo('STANDARD').notNullable();
        table.string('subfolder', 300);
        table.string('routerpattern', 300);
        table.string('active_systems_deploy', 300);
        table.string('active_systems_promote', 300);
        table.string('active_systems_remove', 300);
        table.string('active_systems_task', 300);
        table.string('active_systems_misc', 300);
        table.string('branches', 300);
        table.string('pullrequests', 300);
        table.string('production_environment', 100);
        table.text('production_routes');
        table.string('production_alias', 100).notNullable().defaultTo('lagoon-production')
        table.string('standby_production_environment', 100);
        table.text('standby_routes');
        table.string('standby_alias', 100).notNullable().defaultTo('lagoon-production')
        table.boolean('auto_idle').notNullable().defaultTo(1);
        table.boolean('storage_calc').notNullable().defaultTo(1);
        table.boolean('problems_ui').notNullable().defaultTo(0);
        table.boolean('facts_ui').notNullable().defaultTo(0);
        table.boolean('deployments_disabled').notNullable().defaultTo(0);
        table.integer('openshift').references('openshift.id');
        table.string('openshift_project_pattern', 300);
        table.integer('development_environments_limit').nullable();
        table.string('private_key', 5000);
        table.dateTime('created').notNullable().defaultTo(knex.fn.now());
    })
    .createTable('billing_modifier', function (table) {
        table.increments('id').primary();
        table.string('group_id', 36);
        table.integer('weight').notNullable().defaultTo(0);
        table.dateTime('start_date').notNullable().defaultTo(knex.fn.now());
        table.dateTime('end_date').notNullable().defaultTo(knex.fn.now());
        table.decimal('discount_fixed').notNullable().defaultTo(0);
        table.float('discount_percentage').notNullable().defaultTo(0);
        table.decimal('extra_fixed').nullable().defaultTo(0);
        table.float('extra_percentage').nullable().defaultTo(0);
        table.float('min').nullable().defaultTo(0);
        table.float('max').nullable().defaultTo(0);
        table.text('customer_comments');
        table.text('admin_comments');
    })
    .createTable('environment', function (table) {
        table.increments('id').primary();
        table.string('name', 100);
        table.integer('project').references('project.id');
        table.enu('deploy_type', ['branch', 'pullrequest', 'promote']).notNullable();
        table.string('deploy_base_ref', 100);
        table.string('deploy_head_ref', 100);
        table.string('deploy_title', 300);
        table.enu('environment_type', ['production', 'development']).notNullable();
        table.boolean('auto_idle').notNullable().defaultTo(1);
        table.string('openshift_project_name', 100);
        table.string('route', 300);
        table.text('routes');
        table.text('monitoring_urls');
        table.integer('openshift').references('openshift.id');
        table.string('openshift_project_pattern', 300);
        table.dateTime('updated').notNullable().defaultTo(knex.fn.now());
        table.dateTime('created').notNullable().defaultTo(knex.fn.now());
        table.dateTime('deleted').notNullable().defaultTo(0); //TODO: check what this does
        table.unique(['project', 'name', 'deleted']);
    })
    .createTable('deploy_target_config', function (table) {
        table.increments('id').primary();
        table.integer('project').references('project.id');
        table.integer('weight').notNullable().defaultTo(0);
        table.string('branches', 300);
        table.string('pullrequests', 300);
        table.integer('deploy_target').references('openshift.id');
        table.string('deploy_target_project_pattern', 300);
    })
    .createTable('environment_storage', function (table) {
        table.increments('id').primary();
        table.integer('environment').references('environment.id');
        table.string('persistent_storage_claim', 100);
        table.bigInteger('bytes_used');
        table.date('updated'); 
        table.unique(['environment', 'persistent_storage_claim', 'updated']);
    })
    .createTable('deployment', function (table) {
        table.increments('id').primary();
        table.string('name', 100).notNullable();
        table.enu('status', ['new', 'pending', 'running', 'cancelled', 'error', 'failed', 'complete']).notNullable();
        table.dateTime('created').notNullable().defaultTo(knex.fn.now());
        table.dateTime('started').nullable();
        table.dateTime('completed').nullable();
        table.integer('environment').references('environment.id');
        table.string('remote_id', 50).nullable();
    })
    .createTable('environment_backup', function (table) {
        table.increments('id').primary();
        table.integer('environment').references('environment.id');
        table.string('source', 300);
        table.string('backup_id', 300).unique();
        table.dateTime('created').notNullable().defaultTo(knex.fn.now());
        table.dateTime('deleted').notNullable().defaultTo(0); //TODO: check what this does
    })
    .createTable('backup_restore', function (table) {
        table.increments('id').primary();
        table.string('backup_id', 300).unique();
        table.enu('status', ['pending', 'successful', 'failed']).defaultTo('pending');
        table.string('restore_location', 300);
        table.dateTime('created').notNullable().defaultTo(knex.fn.now());
    })
    .createTable('env_vars', function (table) {
        table.increments('id').primary();
        table.string('name', 100);
        table.text('value').notNullable();
        table.enu('scope',['global', 'build', 'runtime', 'container_registry', 'internal_container_registry']).notNullable().defaultTo('global');
        table.integer('project').nullable().references('project.id');
        table.integer('environment').references('environment.id'); //TODO: note that the def in the existing schema is wrong
        table.unique(['name', 'project']);
        table.unique(['name', 'environment']);
    })
    .createTable('environment_service', function (table) {
        table.increments('id').primary();
        table.integer('environment').references('environment.id');
        table.string('name', 100).notNullable();
    })
    .createTable('task', function (table) {
        table.increments('id').primary();
        table.string('name', 100).notNullable();
        table.integer('environment').references('environment.id');
        table.string('service', 300).notNullable();
        table.string('command', 300).notNullable();
        table.enu('status', ['active', 'succeeded', 'failed']).notNullable();
        table.dateTime('created').notNullable().defaultTo(knex.fn.now());
        table.dateTime('started').nullable();
        table.dateTime('completed').nullable();
        table.string('remote_id', 50).nullable();
        table.enu('type', ['standard', 'advanced']).notNullable().defaultTo('standard');
        table.string('advanced_image', 2000).nullable();
        table.text('advanced_payload');
    })
    .createTable('s3_file', function (table) {
        table.increments('id').primary();
        table.string('filename', 100).notNullable();
        table.text('s3_key').notNullable();
        table.dateTime('created').notNullable().defaultTo(knex.fn.now());
        table.dateTime('deleted').notNullable().defaultTo(0);
    })
    .createTable('environment_problem', function (table) {
        table.increments('id').primary();
        table.integer('environment').references('environment.id');
        table.string('severity', 300).nullable().defaultTo('');
        table.decimal('severity_score', 1).defaultTo(0);
        table.string('identifier', 300).notNullable().defaultTo('');
        table.string('lagoon_service', 300).nullable().defaultTo('');
        table.string('source', 300).nullable().defaultTo('');
        table.string('associated_package', 300).nullable().defaultTo('');
        table.text('description');
        table.string('version', 300).nullable().defaultTo('');
        table.string('fixed_version', 300).nullable().defaultTo('');
        table.string('links', 300).nullable().defaultTo('');
        table.json('data');
        table.dateTime('created').notNullable().defaultTo(knex.fn.now());
        table.dateTime('deleted').notNullable().defaultTo(0);
        table.unique(['environment', 'lagoon_service', 'version', 'identifier', 'deleted']);
    })
    .createTable('problem_harbor_scan_matcher', function (table) {
        table.increments('id').primary();
        table.string('name', 100).notNullable();
        table.text('description');
        table.string('default_lagoon_project', 300).nullable();
        table.string('default_lagoon_environment', 300).nullable();
        table.string('default_lagoon_service_name', 300).nullable();
        table.string('regex', 300).notNullable();
    })
    .createTable('project_notification', function (table) {
        table.integer('nid');
        table.integer('pid').nullable().references('project.id');
        table.enu('type', ['slack','rocketchat','microsoftteams','email', 'webhook']).notNullable();
        table.enu('content_type', ['deployment', 'problem']).notNullable();
        table.integer('notification_severity_threshold').notNullable().defaultTo(0);
        table.primary(['nid', 'pid', 'type']);
    })
    .createTable('user_ssh_key', function (table) {
        table.integer('cid').nullable().references('customer.id');
        table.integer('usid').nullable().references('user.id');
        table.primary(['cid', 'usid']);
    })
    .createTable('task_file', function (table) {
        table.integer('tid').nullable().references('task.id');
        table.integer('fid').nullable().references('file.id');
        table.primary(['tid', 'fid']);
    })
    .createTable('environment_fact', function (table) {
        table.increments('id').primary();
        table.integer('environment').references('environment.id');
        table.string('name', 300).notNullable();
        table.string('value', 300).notNullable();
        table.enu('type', ['TEXT', 'URL', 'SEMVER']).notNullable().defaultTo('TEXT');
        table.string('source', 300).nullable().defaultTo('');
        table.text('description').nullable().defaultTo('');
        table.dateTime('created').notNullable().defaultTo(knex.fn.now());
        table.text('category').nullable().defaultTo('');
        table.boolean('key_fact').notNullable().defaultTo(0);
        table.unique(['environment', 'name']);
    })
    .createTable('environment_fact_reference', function (table) {
        table.increments('id').primary();
        table.integer('fid').nullable().references('fact.id');
        table.string('name', 300).notNullable();
        table.primary(['fid', 'name']);
    })
    .createTable('advanced_task_definition', function (table) {
        table.increments('id').primary();
        table.string('name', 300).notNullable();
        table.text('description').nullable().defaultTo('');
        table.string('image', 2000).nullable().defaultTo('');
        table.string('service', 100);
        table.string('type', 100).notNullable();
        table.integer('environment').references('environment.id');
        table.integer('project').references('project.id');
        table.string('group_name', 2000).nullable();
        table.enu('permission', ['GUEST', 'DEVELOPER', 'MAINTAINER']).notNullable().defaultTo('GUEST');
        table.text('command').nullable().defaultTo('');
        table.dateTime('created').notNullable().defaultTo(knex.fn.now());
        table.dateTime('deleted').notNullable().defaultTo(0);
        table.unique(['name', 'environment', 'project', 'group_name']);
    })
    .createTable('advanced_task_definition_argument', function (table) {
        table.increments('id').primary();
        table.integer('advanced_task_definition').references('advanced_task_definition.id');
        table.string('name', 300).notNullable(); //TODO: this is currently unique in the existing setup - that's wrong
        table.enu('type', ['NUMERIC', 'STRING']).notNullable();
    })
    ;
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema
        .dropTable("advanced_task_definition_argument")
        .dropTable("advanced_task_definition")
        .dropTable("environment_fact_reference")
        .dropTable("environment_fact")
        .dropTable("task_file")
        .dropTable("user_ssh_key")
        .dropTable("project_notification")
        .dropTable("problem_harbor_scan_matcher")
        .dropTable("environment_problem")
        .dropTable("s3_file")
        .dropTable("task")
        .dropTable("environment_service")
        .dropTable("env_vars")
        .dropTable("backup_restore")
        .dropTable("environment_backup")
        .dropTable("deployment")
        .dropTable("environment_storage")
        .dropTable("deploy_target_config")
        .dropTable("environment")
        .dropTable("billing_modifier")
        .dropTable("project")
        .dropTable("notification_email")
        .dropTable("notification_slack")
        .dropTable("notification_rocketchat")
        .dropTable("notification_microsoftteams")
        .dropTable("openshift")
        .dropTable("customer")
        .dropTable("user")
        .dropTable("ssh_key");
};
