USE infrastructure;

DELIMITER $$

CREATE OR REPLACE PROCEDURE
  CreateProject
  (
    IN id                        int,
    IN name                      varchar(100),
    IN customer                  int,
    IN git_url                   varchar(300),
    IN subfolder                 varchar(300),
    IN openshift                 int,
    IN openshift_project_pattern varchar(300),
    IN active_systems_deploy     varchar(300),
    IN active_systems_promote    varchar(300),
    IN active_systems_remove     varchar(300),
    IN branches                  varchar(300),
    IN pullrequests              varchar(300),
    IN production_environment    varchar(100),
    IN auto_idle                 int(1),
    IN storage_calc              int(1)
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
        customer,
        git_url,
        subfolder,
        active_systems_deploy,
        active_systems_promote,
        active_systems_remove,
        branches,
        production_environment,
        auto_idle,
        storage_calc,
        pullrequests,
        openshift,
        openshift_project_pattern
    )
    SELECT
        id,
        name,
        c.id,
        git_url,
        subfolder,
        active_systems_deploy,
        active_systems_promote,
        active_systems_remove,
        branches,
        production_environment,
        auto_idle,
        storage_calc,
        pullrequests,
        os.id,
        openshift_project_pattern
    FROM
        openshift AS os,
        customer AS c
    WHERE
        os.id = openshift AND
        c.id = customer;

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

CREATE OR REPLACE PROCEDURE
  DeleteProject
  (
    IN p_project varchar(50)
  )
  BEGIN
    DECLARE v_pid int;

    SELECT id INTO v_pid FROM project WHERE project.name = p_project;

    DELETE FROM project_ssh_key WHERE pid = v_pid;
    DELETE FROM project_notification WHERE pid = v_pid;
    DELETE FROM project WHERE id = v_pid;
  END;
$$

CREATE OR REPLACE PROCEDURE
  CreateOrUpdateEnvironment
  (
    IN name                   varchar(100),
    IN pid                    int,
    IN deploy_type               ENUM('branch', 'pullrequest', 'promote'),
    IN environment_type       ENUM('production', 'development'),
    IN openshift_projectname  varchar(100)
  )
  BEGIN
    INSERT INTO environment (
        name,
        project,
        deploy_type,
        environment_type,
        openshift_projectname,
        deleted
    )
    SELECT
        name,
        p.id,
        deploy_type,
        environment_type,
        openshift_projectname,
        '0000-00-00 00:00:00'
    FROM
        project AS p
    WHERE
        p.id = pid
    ON DUPLICATE KEY UPDATE
        deploy_type=deploy_type,
        environment_type=environment_type,
        updated=NOW();

    -- Return the constructed project
    SELECT
      e.*
    FROM environment e
    WHERE e.name = name AND
    deleted = '0000-00-00 00:00:00';
  END;
$$


CREATE OR REPLACE PROCEDURE
  CreateOrUpdateEnvironmentStorage
  (
    IN environment              int,
    IN persistent_storage_claim varchar(100),
    IN bytes_used               bigint
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
        DATE(NOW())
    )
    ON DUPLICATE KEY UPDATE
        bytes_used=bytes_used;

    SELECT
      *
    FROM environment_storage es
    WHERE es.environment = environment AND
          es.persistent_storage_claim = persistent_storage_claim AND
          es.updated = DATE(NOW());
  END;
$$


CREATE OR REPLACE PROCEDURE
  DeleteEnvironment
  (
    IN name      varchar(100),
    IN project   int
  )
  BEGIN

    UPDATE
      environment e
    SET
      e.deleted=NOW()
    WHERE
      e.name = name AND
      e.project = project AND
      e.deleted = '0000-00-00 00:00:00';

  END;
$$

CREATE OR REPLACE PROCEDURE
  CreateSshKey
  (
    IN id                     int,
    IN name                   varchar(100),
    IN keyValue               varchar(5000),
    IN keyType                varchar(300)
  )
  BEGIN
    DECLARE new_sid int;

    IF (id IS NULL) THEN
      SET id = 0;
    END IF;

    INSERT INTO ssh_key (
      id,
      name,
      keyValue,
      keyType
    ) VALUES (
      id,
      name,
      keyValue,
      keyType
    );

    IF (id = 0) THEN
      SET new_sid = LAST_INSERT_ID();
    ELSE
      SET new_sid = id;
    END IF;

    SELECT
      sk.id,
      sk.name,
      sk.keyValue,
      sk.keyType,
      sk.created
    FROM ssh_key sk
    WHERE sk.id = new_sid;
  END;
$$

CREATE OR REPLACE PROCEDURE
  DeleteSshKey
  (
    IN p_name varchar(100)
  )
  BEGIN
    DECLARE v_skid int;

    SELECT id INTO v_skid FROM ssh_key WHERE ssh_key.name = p_name;

    DELETE FROM customer_ssh_key WHERE skid = v_skid;
    DELETE FROM project_ssh_key WHERE skid = v_skid;
    DELETE FROM ssh_key WHERE id = v_skid;
  END;
$$

CREATE OR REPLACE PROCEDURE
  CreateCustomer
  (
    IN id             int,
    IN name           varchar(50),
    IN comment        text,
    IN private_key    varchar(5000)
  )
  BEGIN
    DECLARE new_cid int;

    IF (id IS NULL) THEN
      SET id = 0;
    END IF;

    INSERT INTO customer (
      id,
      name,
      comment,
      private_key
    ) VALUES (
      id,
      name,
      comment,
      private_key
    );

    IF (id = 0) THEN
      SET new_cid = LAST_INSERT_ID();
    ELSE
      SET new_cid = id;
    END IF;

    SELECT
      c.id,
      c.name,
      c.comment,
      c.private_key,
      c.created
    FROM customer c
    WHERE c.id = new_cid;
  END;
$$

CREATE OR REPLACE PROCEDURE
  DeleteCustomer
  (
    IN p_name varchar(100)
  )
  BEGIN
    DECLARE v_cid int;
    DECLARE count int;

    SELECT count(*) INTO count
    FROM project
    LEFT JOIN customer ON project.customer = customer.id
    WHERE customer.name = p_name;

    IF count > 0 THEN
      SET @message_text = concat('Customer: "', p_name, '" still in use, can not delete');
      SIGNAL SQLSTATE '02000'
      SET MESSAGE_TEXT = @message_text;
    END IF;

    SELECT id INTO v_cid
      FROM customer c
      WHERE c.name = p_name;

    DELETE FROM customer_ssh_key WHERE v_cid = cid;
    DELETE FROM customer WHERE id = v_cid;
  END;
$$

CREATE OR REPLACE PROCEDURE
  CreateOpenshift
  (
    IN p_id              int,
    IN p_name            varchar(50),
    IN p_console_url     varchar(300),
    IN p_token           varchar(1000),
    IN p_router_pattern  varchar(300),
    IN p_project_user    varchar(100),
    IN p_ssh_host        varchar(300),
    IN p_ssh_port        varchar(50)
  )
  BEGIN
    DECLARE new_oid int;

    IF (p_id IS NULL) THEN
      SET p_id = 0;
    END IF;

    INSERT INTO openshift (
      id,
      name,
      console_url,
      token,
      router_pattern,
      project_user,
      ssh_host,
      ssh_port
    ) VALUES (
      p_id,
      p_name,
      p_console_url,
      p_token,
      p_router_pattern,
      p_project_user,
      p_ssh_host,
      p_ssh_port
    );

    IF (p_id = 0) THEN
      SET new_oid = LAST_INSERT_ID();
    ELSE
      SET new_oid = p_id;
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
    IN p_name varchar(100)
  )
  BEGIN
    DECLARE count int;

    SELECT count(*) INTO count
      FROM project p
      LEFT JOIN openshift o ON p.openshift = o.id
      WHERE o.name = p_name;

    IF count > 0 THEN
      SET @message_text = concat('Openshift: "', name, '" still in use, can not delete');
      SIGNAL SQLSTATE '02000'
      SET MESSAGE_TEXT = @message_text;
    END IF;

    DELETE FROM openshift WHERE name = p_name;
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
    ) VALUES (
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
    ) VALUES (
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
  CreateProjectSshKey
  (
    IN project            varchar(50),
    IN ssh_key            varchar(100)
  )
  BEGIN

    INSERT INTO project_ssh_key (
      pid,
      skid
    ) SELECT
      p.id,
      sk.id
    FROM
      project AS p,
      ssh_key AS sk
    WHERE
      p.name = project AND
      sk.name = ssh_key;

    SELECT
      *
    FROM project as p
    WHERE p.name = project;

  END;
$$

CREATE OR REPLACE PROCEDURE
  DeleteProjectSshKey
  (
    IN p_project            varchar(50),
    IN p_ssh_key            varchar(100)
  )
  BEGIN

    DELETE
      project_ssh_key
    FROM
      project_ssh_key
    LEFT JOIN project ON project_ssh_key.pid = project.id
    LEFT JOIN ssh_key ON project_ssh_key.skid = ssh_key.id
    WHERE
      project.name = p_project AND
      ssh_key.name = p_ssh_key;

    SELECT
      *
    FROM project as p
    WHERE p.name = p_project;

  END;
$$

CREATE OR REPLACE PROCEDURE
  CreateCustomerSshKey
  (
    IN p_customer            varchar(50),
    IN p_ssh_key            varchar(100)
  )
  BEGIN
    DECLARE count int;

    SELECT count(*) INTO count
      FROM ssh_key sk
      WHERE sk.name = p_ssh_key;

    IF count = 0 THEN
      SET @message_text = concat('SSH-Key: "', p_ssh_key, '" does not exist');
      SIGNAL SQLSTATE '02000'
      SET MESSAGE_TEXT = @message_text;
    END IF;

    INSERT INTO customer_ssh_key (
      cid,
      skid
    ) SELECT
      c.id,
      sk.id
    FROM
      customer AS c,
      ssh_key AS sk
    WHERE
      c.name = p_customer AND
      sk.name = p_ssh_key;

    SELECT
      *
    FROM customer as c
    WHERE c.name = p_customer;

  END;
$$

CREATE OR REPLACE PROCEDURE
  DeleteCustomerSshKey
  (
    IN p_customer            varchar(50),
    IN p_ssh_key            varchar(100)
  )
  BEGIN

    DELETE
      customer_ssh_key
    FROM
      customer_ssh_key
    LEFT JOIN customer ON customer_ssh_key.cid = customer.id
    LEFT JOIN ssh_key ON customer_ssh_key.skid = ssh_key.id
    WHERE
      customer.name = p_customer AND
      ssh_key.name = p_ssh_key;

    SELECT
      *
    FROM customer as c
    WHERE c.name = p_customer;
  END;
$$

DELIMITER ;
