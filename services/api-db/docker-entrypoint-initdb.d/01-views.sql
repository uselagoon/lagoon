USE infrastructure;

-- Views

DROP VIEW IF EXISTS pid_skid;
CREATE VIEW pid_skid
AS
  SELECT DISTINCT
    p.id AS pid,
    csk.skid AS skid
  FROM
    customer_ssh_key csk
    INNER JOIN customer c ON csk.cid = c.id
    INNER JOIN project p ON p.customer = c.id
  UNION DISTINCT
  SELECT
    psk.pid AS pid,
    psk.skid AS skid
  FROM project_ssh_key psk;

DROP VIEW IF EXISTS permission;
CREATE VIEW permission
AS
  SELECT
    sk.id AS key_id,
    CONCAT(sk.key_type, ' ', sk.key_value) AS ssh_key,
    (
      SELECT GROUP_CONCAT(DISTINCT csk.cid SEPARATOR ',')
      FROM customer_ssh_key csk
      WHERE csk.skid = sk.id
    ) AS customers,
    (
      SELECT GROUP_CONCAT(DISTINCT r.pid SEPARATOR ',')
      FROM pid_skid AS r
      WHERE r.skid = sk.id
    ) AS projects
  FROM ssh_key sk;
