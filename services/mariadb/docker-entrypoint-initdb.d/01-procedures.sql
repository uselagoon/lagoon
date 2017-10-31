DELIMITER $$

CREATE OR REPLACE PROCEDURE
  CreateProject
  (
    IN name                   varchar(100),
    IN customer               varchar(50),
    IN git_url                varchar(300),
    IN openshift              varchar(50),
    IN slack                  varchar(50),
    IN active_systems_deploy  varchar(300),
    IN active_systems_remove  varchar(300),
    IN branches               varchar(300),
    IN pullrequests           boolean,
    IN ssh_key_names          text
  )
  BEGIN
    DECLARE new_pid int;

    INSERT INTO project (
        name,
        customer,
        git_url,
        slack,
        active_systems_deploy,
        active_systems_remove,
        branches,
        pullrequests,
        openshift
    )
    SELECT
        name,
        c.id,
        git_url,
        s.id,
        active_systems_deploy,
        active_systems_remove,
        branches,
        pullrequests,
        os.id
    FROM
        openshift AS os,
        customer AS c
    LEFT JOIN
        slack AS s ON (s.name = slack)
    WHERE
        os.name = openshift AND
        c.name = customer;

    -- Now add the ssh-key relation to the newly created project
    SET new_pid = LAST_INSERT_ID();

    INSERT INTO project_ssh_key (pid, skid)
    SELECT
      new_pid,
      id
    FROM ssh_key
    WHERE FIND_IN_SET(ssh_key.name, ssh_key_names) > 0;

    -- Return the constructed project
    SELECT
      p.id,
      p.name,
      p.customer,
      p.git_url,
      p.slack,
      p.active_systems_deploy,
      p.active_systems_remove,
      p.branches,
      p.pullrequests,
      p.openshift
    FROM project p
    WHERE id = new_pid;
  END;
$$

CREATE OR REPLACE PROCEDURE
  CreateSshKey
  (
    IN name                   varchar(100),
    IN keyValue               varchar(5000),
    IN keyType                varchar(300)
  )
  BEGIN
    DECLARE new_sid int;

    INSERT INTO ssh_key (
      name,
      keyValue,
      keyType
    ) VALUES (
      name,
      keyValue,
      keyType
    );

    SET new_sid = LAST_INSERT_ID();

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
  CreateCustomer
  (
    IN name           varchar(50),
    IN comment        text,
    IN private_key    varchar(5000),
    IN ssh_key_names  text
  )
  BEGIN
    DECLARE new_cid int;

    INSERT INTO customer (
      name,
      comment,
      private_key
    ) VALUES (
      name,
      comment,
      private_key
    );

    SET new_cid = LAST_INSERT_ID();

    INSERT INTO customer_ssh_key (cid, skid)
    SELECT
      new_cid,
      id
    FROM ssh_key
    WHERE FIND_IN_SET(ssh_key.name, ssh_key_names) > 0;

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
  CreateOpenshift
  (
    IN name            varchar(50),
    IN console_url     varchar(300),
    IN token           varchar(1000),
    IN router_pattern  varchar(300),
    IN project_user    varchar(100)
  )
  BEGIN
    DECLARE new_oid int;

    INSERT INTO openshift (
      name,
      console_url,
      token,
      router_pattern,
      project_user
    ) VALUES (
      name,
      console_url,
      token,
      router_pattern,
      project_user
    );

    SET new_oid = LAST_INSERT_ID();

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
  CreateSlack
  (
    IN name        varchar(50),
    IN webhook     varchar(300),
    IN channel     varchar(300)
  )
  BEGIN
    DECLARE new_sid int;

    INSERT INTO slack (
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
    FROM slack
    WHERE id = new_sid;
  END;
$$

DELIMITER ;
