DELIMITER $$

CREATE OR REPLACE PROCEDURE
  CreateProject
  (
    IN id                     int,
    IN name                   varchar(100),
    IN customer               int,
    IN git_url                varchar(300),
    IN openshift              int,
    IN active_systems_deploy  varchar(300),
    IN active_systems_remove  varchar(300),
    IN branches               varchar(300),
    IN pullrequests           boolean,
    IN production_environment varchar(100)
  )
  BEGIN
    DECLARE new_pid int;

    INSERT INTO project (
        id,
        name,
        customer,
        git_url,
        active_systems_deploy,
        active_systems_remove,
        branches,
        production_environment,
        pullrequests,
        openshift
    )
    SELECT
        id,
        name,
        c.id,
        git_url,
        active_systems_deploy,
        active_systems_remove,
        branches,
        production_environment,
        pullrequests,
        os.id
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
    WHERE id = new_pid;
  END;
$$

CREATE OR REPLACE PROCEDURE
  DeleteProject
  (
    IN pid int
  )
  BEGIN
    DELETE FROM project WHERE id = pid;
    DELETE FROM project_notification WHERE pid = pid;
    DELETE FROM project_ssh_key WHERE pid = pid;

  END;
$$

CREATE OR REPLACE PROCEDURE
  CreateOrUpdateEnvironment
  (
    IN name                   varchar(100),
    IN pid                    int,
    IN git_type               ENUM('branch', 'pullrequest'),
    IN environment_type       ENUM('production', 'development'),
    IN openshift_projectname  varchar(100)
  )
  BEGIN
    INSERT INTO environment (
        name,
        project,
        git_type,
        environment_type,
        openshift_projectname
    )
    SELECT
        name,
        p.id,
        git_type,
        environment_type,
        openshift_projectname
    FROM
        project AS p
    WHERE
        p.id = pid
    ON DUPLICATE KEY UPDATE
        git_type=git_type,
        environment_type=environment_type,
        updated=NOW();

    -- Return the constructed project
    SELECT
      e.*
    FROM environment e
    WHERE e.name = name;
  END;
$$

CREATE OR REPLACE PROCEDURE
  DeleteEnvironment
  (
    IN name      varchar(100),
    IN project   varchar(50)
  )
  BEGIN

    DELETE
      environment
    FROM
      environment
    JOIN
      project ON environment.project = project.id
    WHERE
      environment.name = name AND
      project.name = project;

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

    SET new_sid = LAST_INSERT_ID();

    IF (id = 0) THEN
      SET new_sid = LAST_INSERT_ID();
    ELSE
      SET new_sid = id;
    END IF;

    SELECT
      id,
      name,
      keyValue,
      keyType,
      created
    FROM ssh_key
    WHERE id = new_sid;
  END;
$$

CREATE OR REPLACE PROCEDURE
  deleteSshKey
  (
    IN name varchar(100)
  )
  BEGIN
    DECLARE skid int;

    SELECT id INTO skid FROM ssh_key WHERE ssh_key.name = name;

    DELETE FROM customer_ssh_key WHERE skid = skid;
    DELETE FROM project_ssh_key WHERE skid = skid;
    DELETE FROM ssh_key WHERE id = skid;


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

    SET new_cid = LAST_INSERT_ID();

    IF (id = 0) THEN
      SET new_cid = LAST_INSERT_ID();
    ELSE
      SET new_cid = id;
    END IF;

    SELECT
      id,
      name,
      comment,
      private_key
      created
    FROM customer
    WHERE id = new_cid;
  END;
$$

CREATE OR REPLACE PROCEDURE
  DeleteCustomer
  (
    IN name varchar(100)
  )
  BEGIN
    DECLARE cid int;
    DECLARE count int;

    SELECT id INTO cid FROM customer WHERE customer.name = name;

    SELECT count(*) INTO count FROM project LEFT JOIN customer ON project.customer = customer.id WHERE customer.name = name;

    IF count > 0 THEN
      SET @message_text = concat('Customer: "', name, '" still in use, can not delete');
      SIGNAL SQLSTATE '02000'
      SET MESSAGE_TEXT = @message_text;
    END IF;

    DELETE FROM customer_ssh_key WHERE cid = cid;
    DELETE FROM customer WHERE id = cid;


  END;
$$

CREATE OR REPLACE PROCEDURE
  CreateOpenshift
  (
    IN id              int,
    IN name            varchar(50),
    IN console_url     varchar(300),
    IN token           varchar(1000),
    IN router_pattern  varchar(300),
    IN project_user    varchar(100)
  )
  BEGIN
    DECLARE new_oid int;

    INSERT INTO openshift (
      id,
      name,
      console_url,
      token,
      router_pattern,
      project_user
    ) VALUES (
      id,
      name,
      console_url,
      token,
      router_pattern,
      project_user
    );

    SET new_oid = LAST_INSERT_ID();

    IF (id = 0) THEN
      SET new_oid = LAST_INSERT_ID();
    ELSE
      SET new_oid = id;
    END IF;

    SELECT
      id,
      name,
      console_url,
      token,
      router_pattern,
      project_user,
      created
    FROM openshift
    WHERE id = new_oid;
  END;
$$

CREATE OR REPLACE PROCEDURE
  DeleteOpenshift
  (
    IN name varchar(100)
  )
  BEGIN
    DECLARE count int;

    SELECT count(*) INTO count FROM project LEFT JOIN openshift ON project.openshift = openshift.id WHERE openshift.name = name;

    IF count > 0 THEN
      SET @message_text = concat('Openshift: "', name, '" still in use, can not delete');
      SIGNAL SQLSTATE '02000'
      SET MESSAGE_TEXT = @message_text;
    END IF;

    DELETE FROM openshift WHERE name = name;

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
  CreateProjectNotification
  (
    IN project            varchar(50),
    IN notificationType   varchar(300),
    IN notificationName   varchar(300)
  )
  BEGIN

    INSERT INTO project_notification (
      pid,
      type,
      nid
    ) SELECT
      p.id,
      notificationType,
      ns.id
    FROM
      project AS p,
      notification_slack AS ns
    WHERE
      p.name = project AND
      ns.name = notificationName;

    SELECT
      *
    FROM project as p
    WHERE p.name = project;

  END;
$$

CREATE OR REPLACE PROCEDURE
  DeleteProjectNotification
  (
    IN project            varchar(50),
    IN notificationType   varchar(300),
    IN notificationName   varchar(300)
  )
  BEGIN

    DELETE
      project_notification
    FROM
      project_notification
    LEFT JOIN project ON project_notification.pid = project.id
    LEFT JOIN notification_slack ON project_notification.nid = notification_slack.id
    WHERE
      type = notificationType AND
      project.name = project AND
      notification_slack.name = notificationName;

    SELECT
      *
    FROM project as p
    WHERE p.name = project;

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
    IN project            varchar(50),
    IN ssh_key            varchar(100)
  )
  BEGIN

    DELETE
      project_ssh_key
    FROM
      project_ssh_key
    LEFT JOIN project ON project_ssh_key.pid = project.id
    LEFT JOIN ssh_key ON project_ssh_key.skid = ssh_key.id
    WHERE
      project.name = project AND
      ssh_key.name = ssh_key;

    SELECT
      *
    FROM project as p
    WHERE p.name = project;

  END;
$$

CREATE OR REPLACE PROCEDURE
  CreateCustomerSshKey
  (
    IN customer            varchar(50),
    IN ssh_key            varchar(100)
  )
  BEGIN

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
      c.name = customer AND
      sk.name = ssh_key;

    SELECT
      *
    FROM customer as c
    WHERE c.name = customer;

  END;
$$

CREATE OR REPLACE PROCEDURE
  DeleteCustomerSshKey
  (
    IN customer            varchar(50),
    IN ssh_key            varchar(100)
  )
  BEGIN

    DELETE
      customer_ssh_key
    FROM
      customer_ssh_key
    LEFT JOIN customer ON customer_ssh_key.cid = customer.id
    LEFT JOIN ssh_key ON customer_ssh_key.skid = ssh_key.id
    WHERE
      customer.name = customer AND
      ssh_key.name = ssh_key;

    SELECT
      *
    FROM customer as c
    WHERE c.name = customer;

  END;
$$

DELIMITER ;
