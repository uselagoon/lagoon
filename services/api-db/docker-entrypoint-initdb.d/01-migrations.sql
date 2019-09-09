USE infrastructure;

-- Migrations

DELIMITER $$

CREATE OR REPLACE PROCEDURE
  add_production_environment_to_project()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'production_environment'
    ) THEN
      ALTER TABLE `project`
      ADD `production_environment` varchar(100);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_ssh_to_openshift()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'openshift'
        AND table_schema = 'infrastructure'
        AND column_name = 'ssh_host'
    ) THEN
      ALTER TABLE `openshift`
      ADD `ssh_host` varchar(300);
      ALTER TABLE `openshift`
      ADD `ssh_port` varchar(50);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  convert_project_pullrequest_to_varchar()

  BEGIN
    DECLARE column_type varchar(50);

    SELECT DATA_TYPE INTO column_type
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      table_name = 'project'
      AND table_schema = 'infrastructure'
      AND column_name = 'pullrequests';

    IF (column_type = 'tinyint') THEN
      ALTER TABLE project
      MODIFY pullrequests varchar(300);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_active_systems_promote_to_project()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'active_systems_promote'
    ) THEN
      ALTER TABLE `project`
      ADD `active_systems_promote` varchar(300);
      UPDATE project
      SET active_systems_promote = 'lagoon_openshiftBuildDeploy';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  rename_git_type_to_deploy_type_in_environment()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'environment'
        AND table_schema = 'infrastructure'
        AND column_name = 'deploy_type'
    ) THEN
      ALTER TABLE `environment`
      CHANGE `git_type` `deploy_type` ENUM('branch','pullrequest');
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_enum_promote_to_deploy_type_in_environment()

  BEGIN
    DECLARE column_type_enum_deploy_type varchar(50);

    SELECT COLUMN_TYPE INTO column_type_enum_deploy_type
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      table_name = 'environment'
      AND table_schema = 'infrastructure'
      AND column_name = 'deploy_type';

    IF (
      column_type_enum_deploy_type = "enum('branch','pullrequest')"
    ) THEN
      ALTER TABLE environment
      MODIFY deploy_type ENUM('branch','pullrequest','promote');
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_autoidle_to_project()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'auto_idle'
    ) THEN
      ALTER TABLE `project`
      ADD `auto_idle` int(1) NOT NULL default '1';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_enum_rocketchat_to_type_in_project_notification()

  BEGIN
    DECLARE column_type_project_notification_type varchar(50);

    SELECT COLUMN_TYPE INTO column_type_project_notification_type
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      table_name = 'project_notification'
      AND table_schema = 'infrastructure'
      AND column_name = 'type';

    IF (
      column_type_project_notification_type = "enum('slack')"
    ) THEN
      ALTER TABLE project_notification
      MODIFY type ENUM('slack','rocketchat');
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_deleted_to_environment()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'environment'
        AND table_schema = 'infrastructure'
        AND column_name = 'deleted'
    ) THEN
      ALTER TABLE `environment`
      DROP INDEX project_name;
      ALTER TABLE `environment`
      ADD `deleted` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00';
      ALTER TABLE `environment`
      ADD UNIQUE KEY `project_name_deleted` (`project`,`name`, `deleted`);
    END IF;
  END;
$$


CREATE OR REPLACE PROCEDURE
  add_storagecalc_to_project()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'storage_calc'
    ) THEN
      ALTER TABLE `project`
      ADD `storage_calc` int(1) NOT NULL default '1';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_project_pattern_to_openshift()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'openshift'
        AND table_schema = 'infrastructure'
        AND column_name = 'project_pattern'
    ) THEN
      ALTER TABLE `openshift`
      ADD `project_pattern` varchar(300);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_subfolder_to_project()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'subfolder'
    ) THEN
      ALTER TABLE `project`
      ADD `subfolder` varchar(300);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  delete_project_pattern_from_openshift()

  BEGIN
    IF EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'openshift'
        AND table_schema = 'infrastructure'
        AND column_name = 'project_pattern'
    ) THEN
      ALTER TABLE `openshift`
      DROP COLUMN `project_pattern`;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_openshift_project_pattern_to_project()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'openshift_project_pattern'
    ) THEN
      ALTER TABLE `project`
      ADD `openshift_project_pattern` varchar(300);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  rename_keyValue_to_key_value_in_ssh_key()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'ssh_key'
        AND table_schema = 'infrastructure'
        AND column_name = 'key_value'
    ) THEN
      ALTER TABLE `ssh_key`
      CHANGE `keyValue` `key_value` varchar(5000) NOT NULL;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  rename_keyType_to_key_type_in_ssh_key()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'ssh_key'
        AND table_schema = 'infrastructure'
        AND column_name = 'key_type'
    ) THEN
      ALTER TABLE `ssh_key`
      CHANGE `keyType` `key_type` ENUM('ssh-rsa', 'ssh-ed25519') NOT NULL DEFAULT 'ssh-rsa';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  -- Rename environment.openshift_projectname to environment_openshift_project_name
  rename_openshift_projectname_in_environment()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'environment'
        AND table_schema = 'infrastructure'
        AND column_name = 'openshift_project_name'
    ) THEN
      ALTER TABLE `environment`
      CHANGE `openshift_projectname` `openshift_project_name` varchar(100);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_routes_monitoring_urls_to_environments()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'environment'
        AND table_schema = 'infrastructure'
        AND column_name = 'route'
    ) THEN
      ALTER TABLE `environment` ADD `route` varchar(300);
      ALTER TABLE `environment` ADD `routes` text;
      ALTER TABLE `environment` ADD `monitoring_urls` text;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_environment_limit_to_project()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'development_environments_limit'
    ) THEN
      ALTER TABLE `project` ADD `development_environments_limit` int;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  drop_legacy_pid_skid_view()

  BEGIN
    DROP VIEW IF EXISTS pid_skid;
  END;
$$

CREATE OR REPLACE PROCEDURE
  create_users_for_orphaned_ssh_keys()

  BEGIN
    DECLARE ssh_key_id INT;
    DECLARE ssh_key_name VARCHAR(100);
    DECLARE user_comment TEXT;
    DECLARE user_email VARCHAR(500);
    DECLARE user_id INT;
    DECLARE loop_done INTEGER DEFAULT 0;

    -- Declare cursor to iterate over orphaned SSH keys (SSH keys which
    -- have no matching entry in user_ssh_key junction table)
    DECLARE orphaned_ssh_keys CURSOR FOR
      SELECT ssh_key.id, ssh_key.name
      FROM ssh_key
      WHERE ssh_key.id NOT IN (
        SELECT skid FROM user_ssh_key
      );

    -- When the next result is not found, stop the loop by setting loop_done variable
    DECLARE CONTINUE HANDLER
      FOR NOT FOUND SET loop_done = 1;

    OPEN orphaned_ssh_keys;

    insert_users_and_user_ssh_keys: LOOP
      -- Fetch the current SSH key ID and name into variables
      FETCH orphaned_ssh_keys INTO ssh_key_id, ssh_key_name;

      IF loop_done = 1 THEN
        LEAVE insert_users_and_user_ssh_keys;
      END IF;

      SET user_comment = CONCAT(
        'User automatically migrated from SSH key with name "',
        ssh_key_id,
        '-',
        ssh_key_name,
        '".'
      );

      SET user_email = CONCAT(
        ssh_key_id,
        '-',
        ssh_key_name
      );

      -- Create a user
      INSERT INTO user(
        email,
        first_name,
        last_name,
        comment
      )
      VALUES (
        user_email,
        'auto-migrated-user',
        'auto-migrated-user',
        user_comment
      );

      -- Select the id of that user and then create a row in the user_ssh_key junction table
      SELECT id INTO user_id FROM user WHERE comment = user_comment;
      INSERT INTO user_ssh_key(usid, skid) VALUES(user_id, ssh_key_id);

      -- Copy SSH key customer permissions to new customer_user junction table
      IF EXISTS (
        SELECT NULL
        FROM INFORMATION_SCHEMA.TABLES
        WHERE
          table_name = 'customer_ssh_key'
          AND table_schema = 'infrastructure'
      ) THEN
        INSERT INTO customer_user(cid, usid)
        SELECT customer_ssh_key.cid, user_id
        FROM customer_ssh_key
        WHERE customer_ssh_key.skid = ssh_key_id;
      END IF;

      -- Copy SSH key project permissions to new project_user junction table
      IF EXISTS (
        SELECT NULL
        FROM INFORMATION_SCHEMA.TABLES
        WHERE
          table_name = 'project_ssh_key'
          AND table_schema = 'infrastructure'
      ) THEN
        INSERT INTO project_user(pid, usid)
        SELECT project_ssh_key.pid, user_id
        FROM project_ssh_key
        WHERE project_ssh_key.skid = ssh_key_id;
      END IF;
    END LOOP insert_users_and_user_ssh_keys;

    CLOSE orphaned_ssh_keys;
  END;
$$

CREATE OR REPLACE PROCEDURE
  drop_legacy_customer_ssh_key_junction_table()

  BEGIN
    DROP TABLE IF EXISTS customer_ssh_key;
  END;
$$

CREATE OR REPLACE PROCEDURE
  drop_legacy_project_ssh_key_junction_table()

  BEGIN
    DROP TABLE IF EXISTS project_ssh_key;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_active_systems_task_to_project()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'active_systems_task'
    ) THEN
      ALTER TABLE `project`
      ADD `active_systems_task` varchar(300);
      UPDATE project
      SET active_systems_task = 'lagoon_openshiftJob';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_default_value_to_task_status()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'task'
        AND table_schema = 'infrastructure'
        AND column_name = 'status'
    ) THEN
      ALTER TABLE `task`
      ALTER COLUMN `status`
      SET DEFAULT 'active';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_scope_to_env_vars()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'env_vars'
        AND table_schema = 'infrastructure'
        AND column_name = 'scope'
    ) THEN
      ALTER TABLE `env_vars`
      ADD `scope` ENUM('global', 'build', 'runtime') NOT NULL DEFAULT 'global';
      UPDATE env_vars
      SET scope = 'global';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_deleted_to_environment_backup()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'environment_backup'
        AND table_schema = 'infrastructure'
        AND column_name = 'deleted'
    ) THEN
      ALTER TABLE `environment_backup`
      ADD `deleted` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00';
      UPDATE environment_backup
      SET deleted = '0000-00-00 00:00:00';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  convert_task_command_to_text()

  BEGIN
    DECLARE column_type varchar(50);

    SELECT DATA_TYPE INTO column_type
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      table_name = 'task'
      AND table_schema = 'infrastructure'
      AND column_name = 'command';

    IF (column_type = 'varchar') THEN
      ALTER TABLE task
      MODIFY command text NOT NULL;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_key_fingerprint_to_ssh_key()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'ssh_key'
        AND table_schema = 'infrastructure'
        AND column_name = 'key_fingerprint'
    ) THEN
      ALTER TABLE `ssh_key`
      ADD `key_fingerprint` char(51) NULL UNIQUE;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_autoidle_to_environment()


  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'environment'
        AND table_schema = 'infrastructure'
        AND column_name = 'auto_idle'
    ) THEN
      ALTER TABLE `environment`
      ADD `auto_idle` int(1) NOT NULL default '1';
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_deploy_base_head_ref_title_to_environment()

  BEGIN
    IF NOT EXISTS(
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'environment'
        AND table_schema = 'infrastructure'
        AND column_name = 'deploy_base_ref'
    ) THEN
      ALTER TABLE `environment`
      ADD `deploy_base_ref` varchar(100),
      ADD `deploy_head_ref` varchar(100),
      ADD `deploy_title` varchar(300);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  convert_env_vars_from_varchar_to_text()

  BEGIN
    DECLARE column_type varchar(300);

    SELECT DATA_TYPE INTO column_type
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      table_name = 'env_vars'
      AND table_schema = 'infrastructure'
      AND column_name = 'value';

    IF (column_type = 'varchar') THEN
      ALTER TABLE `env_vars`
      MODIFY `value` text NOT NULL;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  convert_user_ssh_key_usid_to_char()

  BEGIN
    DECLARE column_type varchar(50);

    SELECT DATA_TYPE INTO column_type
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      table_name = 'user_ssh_key'
      AND table_schema = 'infrastructure'
      AND column_name = 'usid';

    IF (column_type = 'int') THEN
      ALTER TABLE user_ssh_key
      MODIFY usid char(36) NOT NULL;
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_private_key_to_project()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE
        table_name = 'project'
        AND table_schema = 'infrastructure'
        AND column_name = 'private_key'
    ) THEN
      ALTER TABLE `project`
      ADD `private_key` varchar(5000);
    END IF;
  END;
$$

CREATE OR REPLACE PROCEDURE
  add_index_for_environment_backup_environment()

  BEGIN
    IF NOT EXISTS (
      SELECT NULL
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE
        table_name = 'environment_backup'
        AND table_schema = 'infrastructure'
        AND index_name='backup_environment'
    ) THEN
      ALTER TABLE `environment_backup`
      ADD INDEX `backup_environment` (`environment`);
    END IF;
  END;
$$

DELIMITER ;

CALL add_production_environment_to_project();
CALL add_ssh_to_openshift();
CALL convert_project_pullrequest_to_varchar();
CALL add_active_systems_promote_to_project();
CALL rename_git_type_to_deploy_type_in_environment();
CALL add_enum_promote_to_deploy_type_in_environment();
CALL add_autoidle_to_project();
CALL add_enum_rocketchat_to_type_in_project_notification();
CALL add_deleted_to_environment;
CALL add_storagecalc_to_project();
CALL add_project_pattern_to_openshift();
CALL add_subfolder_to_project();
CALL delete_project_pattern_from_openshift();
CALL add_openshift_project_pattern_to_project();
CALL rename_keyValue_to_key_value_in_ssh_key();
CALL rename_keyType_to_key_type_in_ssh_key();
CALL rename_openshift_projectname_in_environment();
CALL add_routes_monitoring_urls_to_environments();
CALL add_environment_limit_to_project();
CALL drop_legacy_pid_skid_view();
CALL create_users_for_orphaned_ssh_keys();
CALL drop_legacy_customer_ssh_key_junction_table();
CALL drop_legacy_project_ssh_key_junction_table();
CALL add_active_systems_task_to_project();
CALL add_default_value_to_task_status();
CALL add_scope_to_env_vars();
CALL add_deleted_to_environment_backup();
CALL convert_task_command_to_text();
CALL add_key_fingerprint_to_ssh_key();
CALL add_autoidle_to_environment();
CALL add_deploy_base_head_ref_title_to_environment();
CALL convert_env_vars_from_varchar_to_text();
CALL convert_user_ssh_key_usid_to_char();
CALL add_private_key_to_project();
CALL add_index_for_environment_backup_environment();

-- Drop legacy SSH key procedures
DROP PROCEDURE IF EXISTS CreateProjectSshKey;
DROP PROCEDURE IF EXISTS DeleteProjectSshKey;
DROP PROCEDURE IF EXISTS CreateCustomerSshKey;
DROP PROCEDURE IF EXISTS DeleteCustomerSshKey;
DROP PROCEDURE IF EXISTS CreateSshKey;
