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

-- Permissions view for calculating what each SSH Key is allowed to view.
-- Example:
-- +--------+-------------------+-----------+------------------------------------+
-- | key_id | ssh_key           | customers | projects                           |
-- +--------+-------------------+-----------+------------------------------------+
-- |      1 | ssh-rsa <key>     | 1,2       | 2,1                                |
-- |      2 | ssh-rsa <key>     | NULL      | NULL                               |
-- |      3 | ssh-rsa <key>     | 1         | 1                                  |
-- |      4 | ssh-rsa <key>     | 3         | 17,16,15,14,12,11,10,9,8,7,6,5,4,3 |
-- |      5 | ssh-ed25519 <key> | 3         | 17,16,15,14,12,11,10,9,8,7,6,5,4,3 |
-- +--------+-------------------+-----------+------------------------------------+
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
