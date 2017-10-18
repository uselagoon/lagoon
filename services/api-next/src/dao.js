// ATTENTION:
// The `sqlClient` part is usually curried in our application

const promisify = require("util").promisify;

const getAllProjects = sqlClient => async () => {};

const addProject = sqlClient => async (cred, input) => {
  if (cred.role !== "admin") {
    throw new Error("Project creation unauthorized.");
  }

  const prep = sqlClient.prepare(`
    CALL CreateProject(
      :name,
      :customer,
      :git_url,
      :slackId,
      :active_systems_deploy,
      :active_systems_remove,
      :branches,
      IF(STRCMP(:pullrequests, 'true'), 1, 0),
      :openshift,
      '${input.sshKeys.join(',')}'
    );
  `);

  // BEGIN NOT ATOMIC

  //       INSERT INTO project (
  //           name,
  //           customer,
  //           git_url,
  //           slack,
  //           active_systems_deploy,
  //           active_systems_remove,
  //           branches,
  //           pullrequests,
  //           openshift
  //         )
  //       SELECT
  //         :name,
  //         c.id,
  //         :git_url,
  //         :slackId,
  //         :active_systems_deploy,
  //         :active_systems_remove,
  //         :branches,
  //         IF(STRCMP(:pullrequests, 'true'), 1, 0),
  //         os.id

  //       FROM
  //         openshift AS os,
  //         customer AS c,
  //         ssh_key AS k
  //       WHERE
  //         os.name = :openshift AND
  //         c.name = :customer AND
  //         k.id IN(${input.sshKeys.join(",")});

  //       SELECT
  //         *
  //       FROM
  //         project
  //       WHERE
  //         id = LAST_INSERT_ID();
  //     END;

  return new Promise((res, rej) => {
    sqlClient.query(prep(input), (err, rows) => {
      if (err) {
        rej(err);
      }

      // TODO: Resolve IDs from customer, slack, openshift, sshKeys
      const project = rows[0][0];
      console.log(rows);

      res(project);
    });

    sqlClient.end();
  });
};

module.exports = {
  getAllProjects,
  addProject
};

// asdf = [
//   [
//     {
//       id: "32",
//       name: "project name28",
//       customer: "1",
//       git_url: "https://example.com",
//       slack: "0",
//       active_systems_deploy: "",
//       active_systems_remove: "",
//       branches: "master",
//       pullrequests: "1",
//       openshift: "1",
//       created: "2017-10-17 09:33:48"
//     },
//     (info: {
//       numRows: "1",
//       affectedRows: "1",
//       insertId: "0",
//       metadata: undefined
//     })
//   ],
//   {
//     info: {
//       numRows: "0",
//       affectedRows: "0",
//       insertId: "0",
//       metadata: undefined
//     }
//   }
// ];
