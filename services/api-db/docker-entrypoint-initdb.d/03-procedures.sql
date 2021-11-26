USE infrastructure;

-- Stored procedures for the API DB
-- DEPRECATED:
-- Since these proved to be awkward to work with and
-- prone to errors, we will write any further queries
-- in the API service using knex.

DELIMITER $$

CREATE OR REPLACE PROCEDURE
  CreateProject
  (
    IN id                              int,
    IN name                            varchar(100),
    IN git_url                         varchar(300),
    IN availability                      varchar(50),
    IN private_key                     varchar(5000),
    IN subfolder                       varchar(300),
    IN router_pattern                  varchar(300),
    IN openshift                       int,
    IN openshift_project_pattern       varchar(300),
    IN active_systems_deploy           varchar(300),
    IN active_systems_promote          varchar(300),
    IN active_systems_remove           varchar(300),
    IN active_systems_task             varchar(300),
    IN active_systems_misc             varchar(300),
    IN branches                        varchar(300),
    IN pullrequests                    varchar(300),
    IN production_environment          varchar(100),
    IN production_routes               text,
    IN production_alias                varchar(100),
    IN standby_production_environment  varchar(100),
    IN standby_routes                  text,
    IN standby_alias                   varchar(100),
    IN auto_idle                       int(1),
    IN storage_calc                    int(1),
    IN problems_ui                     int(1),
    IN facts_ui                        int(1),
    IN deployments_disabled            int(1),
    IN development_environments_limit  int
  )
  BEGIN
    DECLARE new_pid int;
    DECLARE v_oid int;

    SELECT o.id INTO v_oid FROM openshift o WHERE o.id = openshift;

    IF (v_oid IS NULL) THEN
      SET @message_text = concat('Openshift ID: "', openshift, '" does not exist');
      SIGNAL SQLSTATE '02000'
      SET MESSAGE_TEXT = @message_text;
    END IF;

    IF (id IS NULL) THEN
      SET id = 0;
    END IF;

    INSERT INTO project (
        id,
        name,
        git_url,
        availability,
        private_key,
        subfolder,
        router_pattern,
        active_systems_deploy,
        active_systems_promote,
        active_systems_remove,
        active_systems_task,
        active_systems_misc,
        branches,
        production_environment,
        production_routes,
        production_alias,
        standby_production_environment,
        standby_routes,
        standby_alias,
        auto_idle,
        problems_ui,
        facts_ui,
        deployments_disabled,
        storage_calc,
        pullrequests,
        openshift,
        openshift_project_pattern,
        development_environments_limit
    )
    SELECT
        id,
        name,
        git_url,
        availability,
        private_key,
        subfolder,
        router_pattern,
        active_systems_deploy,
        active_systems_promote,
        active_systems_remove,
        active_systems_task,
        active_systems_misc,
        branches,
        production_environment,
        production_routes,
        production_alias,
        standby_production_environment,
        standby_routes,
        standby_alias,
        auto_idle,
        problems_ui,
        facts_ui,
        deployments_disabled,
        storage_calc,
        pullrequests,
        os.id,
        openshift_project_pattern,
        development_environments_limit
    FROM
        openshift AS os
    WHERE
        os.id = openshift;

    -- id = 0 explicitly tells auto-increment field
    -- to auto-generate a value
    IF (id = 0) THEN
      SET new_pid = LAST_INSERT_ID();
    ELSE
      SET new_pid = id;
    END IF;

    -- Return the constructed project
    SELECT
      p.*
    FROM project p
    WHERE p.id = new_pid;
  END;
$$

DROP PROCEDURE IF EXISTS DeleteProject;
$$

CREATE OR REPLACE PROCEDURE
  CreateOrUpdateEnvironment
  (
    IN id                         int,
    IN name                       varchar(100),
    IN pid                        int,
    IN deploy_type                ENUM('branch', 'pullrequest', 'promote'),
    IN deploy_base_ref            varchar(100),
    IN deploy_head_ref            varchar(100),
    IN deploy_title               varchar(300),
    IN environment_type           ENUM('production', 'development'),
    IN openshift_project_name     varchar(100),
    IN openshift                  int,
    IN openshift_project_pattern  varchar(300)
  )
  BEGIN
    INSERT INTO environment (
        id,
        name,
        project,
        deploy_type,
        deploy_base_ref,
        deploy_head_ref,
        deploy_title,
        environment_type,
        openshift_project_name,
        openshift,
        openshift_project_pattern,
        deleted
    )
    SELECT
        id,
        name,
        p.id,
        deploy_type,
        deploy_base_ref,
        deploy_head_ref,
        deploy_title,
        environment_type,
        openshift_project_name,
        openshift,
        openshift_project_pattern,
        '0000-00-00 00:00:00'
    FROM
        project AS p
    WHERE
        p.id = pid
    ON DUPLICATE KEY UPDATE
        deploy_type=deploy_type,
        deploy_base_ref=deploy_base_ref,
        deploy_head_ref=deploy_head_ref,
        deploy_title=deploy_title,
        environment_type=environment_type,
        updated=NOW();

    -- Return the constructed project
    SELECT
      e.*
    FROM environment e
    WHERE e.name = name AND
    e.project = pid AND
    e.deleted = '0000-00-00 00:00:00';
  END;
$$


CREATE OR REPLACE PROCEDURE
  CreateOrUpdateEnvironmentStorage
  (
    IN environment              int,
    IN persistent_storage_claim varchar(100),
    IN bytes_used               bigint,
    IN updated                  date
  )
  BEGIN
    INSERT INTO environment_storage (
        environment,
        persistent_storage_claim,
        bytes_used,
        updated
    ) VALUES (
        environment,
        persistent_storage_claim,
        bytes_used,
        updated
    )
    ON DUPLICATE KEY UPDATE
        bytes_used=bytes_used;

    SELECT
      *
    FROM environment_storage es
    WHERE es.environment = environment AND
          es.persistent_storage_claim = persistent_storage_claim AND
          es.updated = updated;
  END;
$$

DROP PROCEDURE IF EXISTS DeleteEnvironment;
$$

CREATE OR REPLACE PROCEDURE
  DeleteSshKey
  (
    IN s_name varchar(100)
  )
  BEGIN
    DECLARE v_skid int;

    SELECT id INTO v_skid FROM ssh_key WHERE ssh_key.name = s_name;

    DELETE FROM user_ssh_key WHERE skid = v_skid;
    DELETE FROM ssh_key WHERE id = v_skid;
  END;
$$

CREATE OR REPLACE PROCEDURE
  DeleteSshKeyById
  (
    IN s_id int
  )
  BEGIN
    DELETE FROM user_ssh_key WHERE skid = s_id;
    DELETE FROM ssh_key WHERE id = s_id;
  END;
$$

CREATE OR REPLACE PROCEDURE
  CreateOpenshift
  (
    IN id                int,
    IN name              varchar(50),
    IN console_url       varchar(300),
    IN token             varchar(2000),
    IN router_pattern    varchar(300),
    IN project_user      varchar(100),
    IN ssh_host          varchar(300),
    IN ssh_port          varchar(50),
    IN monitoring_config varchar(2048)
  )
  BEGIN
    DECLARE new_oid int;

    IF (id IS NULL) THEN
      SET id = 0;
    END IF;

    INSERT INTO openshift (
      id,
      name,
      console_url,
      token,
      router_pattern,
      project_user,
      ssh_host,
      ssh_port,
      monitoring_config
    ) VALUES (
      id,
      name,
      console_url,
      token,
      router_pattern,
      project_user,
      ssh_host,
      ssh_port,
      monitoring_config
    );

    IF (id = 0) THEN
      SET new_oid = LAST_INSERT_ID();
    ELSE
      SET new_oid = id;
    END IF;

    SELECT
      o.*
    FROM openshift o
    WHERE o.id = new_oid;
  END;
$$

CREATE OR REPLACE PROCEDURE
  DeleteOpenshift
  (
    IN o_name varchar(100)
  )
  BEGIN
    DECLARE count int;

    SELECT count(*) INTO count
      FROM project p
      LEFT JOIN openshift o ON p.openshift = o.id
      WHERE o.name = o_name;

    IF count > 0 THEN
      SET @message_text = concat('Openshift: "', o_name, '" still in use, can not delete');
      SIGNAL SQLSTATE '02000'
      SET MESSAGE_TEXT = @message_text;
    END IF;

    DELETE FROM openshift WHERE name = o_name;
  END;
$$

CREATE OR REPLACE PROCEDURE
  CreateNotificationMicrosoftTeams
  (
    IN name        varchar(50),
    IN webhook     varchar(300)
  )
  BEGIN
    DECLARE new_sid int;

    INSERT INTO notification_microsoftteams (
      name,
      webhook
    )
    VALUES (
      name,
      webhook
    );

    SET new_sid = LAST_INSERT_ID();

    SELECT
      id,
      name,
      webhook
    FROM notification_microsoftteams
    WHERE id = new_sid;
  END;
$$

CREATE OR REPLACE PROCEDURE
  DeleteNotificationMicrosoftTeams
  (
    IN name varchar(50)
  )
  BEGIN
    DECLARE nsid int;

    SELECT id INTO nsid FROM notification_microsoftteams ns WHERE ns.name = name;

    DELETE FROM notification_microsoftteams WHERE id = nsid;
    DELETE FROM project_notification WHERE nid = nsid AND type = 'microsoftteams';
  END;
$$

CREATE OR REPLACE PROCEDURE
  CreateNotificationRocketChat
  (
    IN name        varchar(50),
    IN webhook     varchar(300),
    IN channel     varchar(300)
  )
  BEGIN
    DECLARE new_sid int;

    INSERT INTO notification_rocketchat (
      name,
      webhook,
      channel
    )
    VALUES (
      name,
      webhook,
      channel
    );

    SET new_sid = LAST_INSERT_ID();

    SELECT
      id,
      name,
      webhook,
      channel
    FROM notification_rocketchat
    WHERE id = new_sid;
  END;
$$

CREATE OR REPLACE PROCEDURE
  DeleteNotificationRocketChat
  (
    IN name varchar(50)
  )
  BEGIN
    DECLARE nsid int;

    SELECT id INTO nsid FROM notification_rocketchat ns WHERE ns.name = name;

    DELETE FROM notification_rocketchat WHERE id = nsid;
    DELETE FROM project_notification WHERE nid = nsid AND type = 'rocketchat';
  END;
$$

CREATE OR REPLACE PROCEDURE
  CreateNotificationSlack
  (
    IN name        varchar(50),
    IN webhook     varchar(300),
    IN channel     varchar(300)
  )
  BEGIN
    DECLARE new_sid int;

    INSERT INTO notification_slack (
      name,
      webhook,
      channel
    )
    VALUES (
      name,
      webhook,
      channel
    );

    SET new_sid = LAST_INSERT_ID();

    SELECT
      id,
      name,
      webhook,
      channel
    FROM notification_slack
    WHERE id = new_sid;
  END;
$$

CREATE OR REPLACE PROCEDURE
  DeleteNotificationSlack
  (
    IN name varchar(50)
  )
  BEGIN
    DECLARE nsid int;

    SELECT id INTO nsid FROM notification_slack ns WHERE ns.name = name;

    DELETE FROM notification_slack WHERE id = nsid;
    DELETE FROM project_notification WHERE nid = nsid AND type = 'slack';
  END;
$$

CREATE OR REPLACE PROCEDURE
  CreateNotificationEmail
  (
    IN name          varchar(50),
    IN email_address varchar(300)
  )
  BEGIN
    DECLARE new_sid int;

    INSERT INTO notification_email (
      name,
      email_address
    )
    VALUES (
      name,
      email_address
    );

    SET new_sid = LAST_INSERT_ID();

    SELECT
      id,
      name,
      email_address
    FROM notification_email
    WHERE id = new_sid;
  END;
$$

CREATE OR REPLACE PROCEDURE
  DeleteNotificationEmail
  (
    IN name varchar(50)
  )
  BEGIN
    DECLARE nsid int;

    SELECT id INTO nsid FROM notification_email ns WHERE ns.name = name;

    DELETE FROM notification_email WHERE id = nsid;
    DELETE FROM project_notification WHERE nid = nsid AND type = 'email';
  END;
$$

CREATE OR REPLACE PROCEDURE
  CreateNotificationWebhook
  (
    IN name        varchar(50),
    IN webhook     varchar(300)
  )
  BEGIN
    DECLARE new_whid int;

    INSERT INTO notification_webhook (
      name,
      webhook
    )
    VALUES (
      name,
      webhook
    );

    SET new_whid = LAST_INSERT_ID();

    SELECT
      id,
      name,
      webhook
    FROM notification_webhook
    WHERE id = new_whid;
  END;
$$

CREATE OR REPLACE PROCEDURE
  DeleteNotificationWebhook
  (
    IN name varchar(50)
  )
  BEGIN
    DECLARE whid int;

    SELECT id INTO whid FROM notification_webhook ns WHERE ns.name = name;

    DELETE FROM notification_webhook WHERE id = whid;
    DELETE FROM project_notification WHERE nid = whid AND type = 'webhook';
  END;
$$

DELIMITER ;
