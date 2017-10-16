// ATTENTION:
// The `sqlClient` part is usually curried in our application

const promisify = require('util').promisify;

const getAllProjects = sqlClient => async () => {};

const addProject = sqlClient => async input => {
  const prep = sqlClient.prepare(`
    BEGIN NOT ATOMIC
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
        :name,
        c.id,
        :git_url,
        :slackId,
        :active_systems_deploy,
        :active_systems_remove,
        :branches,
        IF(STRCMP(:pullrequests, 'true'), 1, 0),
        os.id
      FROM
        openshift AS os,
        customer AS c
      WHERE
        os.name = :openshift AND
        c.name = :customer;
    END;
  `);

  return new Promise((res, rej) => {
    sqlClient.query(prep(input), (err, rows) => {
      if (err) {
        rej(err);
      }
      const id = rows.info.insertId;

      res(id);
    });

    sqlClient.end();
  });
};

module.exports = {
  getAllProjects,
  addProject,
};
