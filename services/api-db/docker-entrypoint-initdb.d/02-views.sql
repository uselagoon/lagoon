USE infrastructure;

-- Views

-- View for aggregating allowed permissions for users on projects
-- +-----+------+
-- | pid | usid |
-- +-----+------+
-- |   1 |    1 |
-- |   1 |    3 |
-- |   2 |    1 |
-- |   3 |    4 |
-- |   3 |    5 |
-- |   4 |    4 |
-- | ... |  ... |
-- +-----+------+
DROP VIEW IF EXISTS pid_usid;
CREATE VIEW pid_usid
AS
  -- Projects where the user has access over their access to the owner customer
  SELECT DISTINCT
    p.id AS pid,
    cu.usid AS usid
  FROM
    customer_user cu
    INNER JOIN customer c ON cu.cid = c.id
    INNER JOIN project p ON p.customer = c.id
  UNION DISTINCT
  -- Projects where the user is directly assigned to the project
  SELECT
    pu.pid AS pid,
    pu.usid AS usid
  FROM project_user pu;

-- Permissions view for calculating what each user is allowed to access.
-- Example:
-- +---------+-----------+------------------------------------+
-- | user_id | customers | projects                           |
-- +---------+-----------+------------------------------------+
-- |       1 | 1,2       | 2,1                                |
-- |       2 | NULL      | NULL                               |
-- |       3 | 1         | 1                                  |
-- |       4 | 3         | 17,16,15,14,12,11,10,9,8,7,6,5,4,3 |
-- |       5 | 3         | 17,16,15,14,12,11,10,9,8,7,6,5,4,3 |
-- +---------+-----------+------------------------------------+
DROP VIEW IF EXISTS permission;
CREATE VIEW permission
AS
  SELECT
    user.id AS user_id,
    -- Comma-separated list of all the customers a user is assigned to
    (
      SELECT GROUP_CONCAT(DISTINCT cu.cid SEPARATOR ',')
      FROM customer_user cu
      WHERE cu.usid = user.id
    ) AS customers,
    -- Comma-separated list of all the project a user has access to
    (
      SELECT GROUP_CONCAT(DISTINCT r.pid SEPARATOR ',')
      FROM pid_usid AS r
      WHERE r.usid = user.id
    ) AS projects
  FROM user;
