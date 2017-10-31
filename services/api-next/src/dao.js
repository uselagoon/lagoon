// ATTENTION:
// The `sqlClient` part is usually curried in our application

const R = require('ramda');
const promisify = require('util').promisify;

const getAllCustomers = sqlClient => async (cred, args) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const { createdAfter } = args;

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      SELECT * FROM customer ${args.createdAfter
        ? 'WHERE created >= :createdAfter'
        : ''}
    `);

    sqlClient.query(prep(args), (err, rows) => {
      if (err) {
        rej(err);
      }

      res(rows);
    });
  });
};

const getAllProjects = sqlClient => async (cred, args) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const { createdAfter } = args;

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      SELECT * FROM project
        ${args.createdAfter ? 'WHERE created >= :createdAfter' : ''}
        ${args.gitUrl ? 'WHERE git_url = :gitUrl' : ''}
    `);

    sqlClient.query(prep(args), (err, rows) => {
      if (err) {
        rej(err);
      }

      res(rows);
    });
  });
};

const getOpenshiftByProjectId = sqlClient => async (cred, pid) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      SELECT
        o.id,
        o.name,
        o.console_url,
        o.token,
        o.router_pattern,
        o.project_user,
        o.created
      FROM project p, openshift o
      WHERE p.id = :pid AND p.openshift = o.id
    `);

    sqlClient.query(prep({ pid }), (err, rows) => {
      if (err) {
        rej(err);
      }

      const ret = rows ? rows[0] : null;
      res(ret);
    });
  });
};
const getSlackByProjectId = sqlClient => async (cred, pid) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      SELECT
        s.id,
        s.name,
        s.webhook,
        s.channel
      FROM project p, slack s
      WHERE p.id = :pid AND p.slack = s.id
    `);

    sqlClient.query(prep({ pid }), (err, rows) => {
      if (err) {
        rej(err);
      }

      const ret = rows ? rows[0] : null;
      res(ret);
    });
  });
};

const getSshKeysByProjectId = sqlClient => async (cred, pid) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      SELECT
        id,
        name,
        keyValue,
        keyType,
        created
      FROM project_ssh_key ps
      JOIN ssh_key sk ON ps.skid = sk.id
      WHERE ps.pid = :pid
    `);

    sqlClient.query(prep({ pid }), (err, rows) => {
      if (err) {
        rej(err);
      }

      res(rows);
    });
  });
};

const getSshKeysByCustomerId = sqlClient => async (cred, cid) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      SELECT
        id,
        name,
        keyValue,
        keyType,
        created
      FROM customer_ssh_key cs
      JOIN ssh_key sk ON cs.skid = sk.id
      WHERE cs.cid = :cid
    `);

    sqlClient.query(prep({ cid }), (err, rows) => {
      if (err) {
        rej(err);
      }

      res(rows);
    });
  });
};

const getCustomerByProjectId = sqlClient => async (cred, pid) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      SELECT
        c.id,
        c.name,
        c.comment,
        c.private_key,
        c.created
      FROM project p
      JOIN customer c ON p.customer = c.id
      WHERE p.id = :pid
    `);

    sqlClient.query(prep({ pid }), (err, rows) => {
      if (err) {
        rej(err);
      }

      const ret = rows ? rows[0] : null;
      res(ret);
    });
  });
};

const getProjectByGitUrl = sqlClient => async (cred, args) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      SELECT
        *
      FROM project
      WHERE git_url = :gitUrl LIMIT 1
    `);

    sqlClient.query(prep(args), (err, rows) => {
      if (err) {
        rej(err);
      }

      const ret = rows ? rows[0] : null;
      res(ret);
    });
  });
};

const getProjectByName = sqlClient => async (cred, args) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      SELECT
        *
      FROM project
      WHERE name = :name`);

    sqlClient.query(prep(args), (err, rows) => {
      if (err) {
        rej(err);
      }

      res(rows[0]);
    });
  });
};

const addProject = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Project creation unauthorized.');
  }

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      CALL CreateProject(
        :name,
        :customer,
        :git_url,
        :openshift,
        ${input.slack ? ':slack' : 'NULL'},
        ${input.active_systems_deploy ? ':active_systems_deploy' : '"lagoon_openshiftBuildDeploy"'},
        ${input.active_systems_remove ? ':active_systems_remove' : '"lagoon_openshiftRemove"'},
        ${input.branches ? ':branches' : '"true"'},
        ${input.pullrequests ? 'IF(STRCMP(:pullrequests, \'true\'), 1, 0)' : 'NULL'},
        '${input.sshKeys ? input.sshKeys.join(',') : ''}'
      );
    `);

    sqlClient.query(prep(input), (err, rows) => {
      if (err) {
        console.log(prep(input))
        console.log(err)
        rej(err);
      }

      // TODO: Maybe resolve IDs from customer, slack, openshift, sshKeys?
      // Not really necessary for a MVP right now IMO
      const project = R.path([0, 0], rows);

      res(project);
    });
  });
};

const addSshKey = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Project creation unauthorized.');
  }

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      CALL CreateSshKey(
        :name,
        :keyValue,
        ${input.keyType ? ':keyType' : 'ssh-rsa'}
      );
    `);

    sqlClient.query(prep(input), (err, rows) => {
      if (err) {
        console.log(err)
        rej(err);
      }

      const ssh_key = R.path([0, 0], rows);

      res(ssh_key);
    });
  });
};

const addCustomer = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Project creation unauthorized.');
  }

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      CALL CreateCustomer(
        :name,
        ${input.comment ? ':comment' : 'NULL'},
        ${input.private_key ? ':private_key' : 'NULL'},
        '${input.sshKeys ? input.sshKeys.join(',') : ''}'
      );
    `);

    sqlClient.query(prep(input), (err, rows) => {
      if (err) {
        console.log(err)
        rej(err);
      }

      const ssh_key = R.path([0, 0], rows);

      res(ssh_key);
    });
  });
};

const addOpenshift = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Project creation unauthorized.');
  }

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      CALL CreateOpenshift(
        :name,
        :console_url,
        ${input.token ? ':token' : 'NULL'},
        ${input.router_pattern ? ':router_pattern' : 'NULL'},
        ${input.project_user ? ':project_user' : 'NULL'}
      );
    `);

    sqlClient.query(prep(input), (err, rows) => {
      if (err) {
        console.log(err)
        rej(err);
      }

      const ssh_key = R.path([0, 0], rows);

      res(ssh_key);
    });
  });
};

const addSlack = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Project creation unauthorized.');
  }

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      CALL CreateSlack(
        :name,
        :webhook,
        :channel
      );
    `);

    sqlClient.query(prep(input), (err, rows) => {
      if (err) {
        console.log(err)
        rej(err);
      }

      const ssh_key = R.path([0, 0], rows);

      res(ssh_key);
    });
  });
};

const truncateTable = sqlClient => async (cred, args) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }


  console.log(args)
  const { tableName } = args;

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      TRUNCATE table \`${tableName}\`;
    `);

    sqlClient.query(prep(args), (err, rows) => {
      if (err) {
        console.log(prep(args))
        rej(err);
      }

      res("success");
    });
  });
};

module.exports = {
  getAllCustomers,
  getOpenshiftByProjectId,
  getProjectByGitUrl,
  getSlackByProjectId,
  getSshKeysByProjectId,
  getSshKeysByCustomerId,
  getCustomerByProjectId,
  getProjectByName,
  getAllProjects,
  addProject,
  addSshKey,
  addCustomer,
  addOpenshift,
  addSlack,
  truncateTable,
};
