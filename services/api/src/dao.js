// ATTENTION:
// The `sqlClient` part is usually curried in our application

const R = require('ramda');

// Useful for creating extra if-conditions for non-admins
const ifNotAdmin = (role, str) =>
  R.ifElse(R.equals('admin'), R.always(''), R.always(str))(role);

// Creates a WHERE statement with AND inbetween non-empty conditions
const whereAnd = whereConds =>
  R.compose(
    R.reduce((ret, str) => {
      if (ret === '') {
        return `WHERE ${str}`;
      } else {
        return `${ret} AND ${str}`;
      }
    }, ''),
    R.filter(R.compose(R.not, R.isEmpty)),
  )(whereConds);

const getPermissions = sqlClient => async args => {
  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(
      `SELECT projects, customerId
       FROM permission
       WHERE sshKey = :sshKey`,
    );
    sqlClient.query(prep(args), (err, rows) => {
      if (err) {
        rej(err);
      }
      const permissions = R.prop(0, rows);

      res(permissions);
    });
  });
};

const getCustomerSshKeys = sqlClient => async cred => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  return new Promise((res, rej) => {
    sqlClient.query(
      `SELECT CONCAT(sk.keyType, ' ', sk.keyValue) as sshKey
       FROM ssh_key sk, customer c, customer_ssh_key csk
       WHERE csk.cid = c.id AND csk.skid = sk.id`,
      (err, rows) => {
        if (err) {
          rej(err);
        }

        const ret = R.map(R.prop('sshKey'), rows);
        res(ret);
      },
    );
  });
};

const getAllCustomers = sqlClient => async (cred, args) => {
  return new Promise((res, rej) => {
    const where = whereAnd([
      args.createdAfter ? 'created >= :createdAfter' : '',
      ifNotAdmin(cred.role, 'id = :customerId'),
    ]);

    const prep = sqlClient.prepare(`SELECT * FROM customer ${where}`);

    sqlClient.query(
      prep({ ...args, customerId: cred.customerId }),
      (err, rows) => {
        if (err) {
          rej(err);
        }

        res(rows);
      },
    );
  });
};

const getAllProjects = sqlClient => async (cred, args) => {
  return new Promise((res, rej) => {
    // We need one "WHERE" keyword, but we have multiple optional conditions
    const where = whereAnd([
      args.createdAfter ? 'created >= :createdAfter' : '',
      args.gitUrl ? 'git_url = :gitUrl' : '',
      ifNotAdmin(cred.role, 'customer = :customerId'),
    ]);

    const prep = sqlClient.prepare(`SELECT * FROM project ${where}`);

    sqlClient.query(
      prep({ ...args, customerId: cred.customerId }),
      (err, rows) => {
        if (err) {
          rej(err);
        }

        res(rows);
      },
    );
  });
};

const getOpenshiftByProjectId = sqlClient => async (cred, pid) => {
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
      FROM project p
      JOIN openshift o ON o.id = p.openshift
      WHERE p.id = :pid
      ${ifNotAdmin(cred.role, 'AND p.customer = :customerId')}
    `);

    sqlClient.query(prep({ pid, customerId: cred.customerId }), (err, rows) => {
      if (err) {
        rej(err);
      }

      const ret = rows ? rows[0] : null;
      res(ret);
    });
  });
};

const getNotificationsByProjectId = sqlClient => async (cred, pid, args) => {
  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      SELECT
        ns.id,
        ns.name,
        ns.webhook,
        ns.channel,
        pn.type
      FROM project_notification pn
      JOIN project p ON p.id = pn.pid
      JOIN notification_slack ns ON pn.nid = ns.id
      WHERE
        pn.pid = :pid
        ${args.type ? 'AND pn.type = :type' : ''}
        ${ifNotAdmin(cred.role, 'AND p.customer = :customerId')}
    `);

    sqlClient.query(
      prep({
        pid: pid,
        type: args.type,
        customerId: cred.customerId,
      }),
      (err, rows) => {
        if (err) {
          rej(err);
        }

        const ret = rows ? rows : null;
        res(ret);
      },
    );
  });
};

const getSshKeysByProjectId = sqlClient => async (cred, pid) => {
  return new Promise((res, rej) => {
    const str = `
      SELECT
        sk.id,
        sk.name,
        sk.keyValue,
        sk.keyType,
        sk.created
      FROM project_ssh_key ps
      JOIN ssh_key sk ON ps.skid = sk.id
      JOIN project p ON ps.pid = p.id
      WHERE ps.pid = :pid
      ${ifNotAdmin(cred.role, 'AND p.customer = :customerId')}
    `;

    const prep = sqlClient.prepare(str);

    sqlClient.query(prep({ pid, customerId: cred.customerId }), (err, rows) => {
      if (err) {
        rej(err);
      }

      res(rows);
    });
  });
};

const getSshKeysByCustomerId = sqlClient => async (cred, cid) => {
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
      ${ifNotAdmin(cred.role, 'AND cs.cid = :customerId')}
    `);

    sqlClient.query(prep({ cid, customerId: cred.customerId }), (err, rows) => {
      if (err) {
        rej(err);
      }

      res(rows);
    });
  });
};

const getCustomerByProjectId = sqlClient => async (cred, pid) => {
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
      ${ifNotAdmin(cred.role, 'AND c.id = :customerId')}
    `);

    sqlClient.query(prep({ pid, customerId: cred.customerId }), (err, rows) => {
      if (err) {
        rej(err);
      }

      const ret = rows ? rows[0] : null;
      res(ret);
    });
  });
};

const getProjectByGitUrl = sqlClient => async (cred, args) => {
  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      SELECT
        *
      FROM project
      WHERE git_url = :gitUrl
      ${ifNotAdmin(cred.role, 'AND customer = :customerId')}
      LIMIT 1
    `);

    sqlClient.query(
      prep({ ...args, customerId: cred.customerId }),
      (err, rows) => {
        if (err) {
          rej(err);
        }

        const ret = rows ? rows[0] : null;
        res(ret);
      },
    );
  });
};

const getProjectByName = sqlClient => async (cred, args) => {
  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      SELECT
        *
      FROM project
      WHERE name = :name
      ${ifNotAdmin(cred.role, 'AND customer = :customerId')}`);

    sqlClient.query(
      prep({ ...args, customerId: cred.customerId }),
      (err, rows) => {
        if (err) {
          rej(err);
        }

        res(rows[0]);
      },
    );
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
        ${
          input.active_systems_deploy
            ? ':active_systems_deploy'
            : '"lagoon_openshiftBuildDeploy"'
        },
        ${
          input.active_systems_remove
            ? ':active_systems_remove'
            : '"lagoon_openshiftRemove"'
        },
        ${input.branches ? ':branches' : '"true"'},
        ${
          input.pullrequests
            ? "IF(STRCMP(:pullrequests, 'true'), 1, 0)"
            : 'NULL'
        },
        '${input.sshKeys ? input.sshKeys.join(',') : ''}'
      );
    `);

    sqlClient.query(prep(input), (err, rows) => {
      if (err) {
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
        rej(err);
      }

      const customer = R.path([0, 0], rows);

      res(customer);
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
        rej(err);
      }

      const openshift = R.path([0, 0], rows);

      res(openshift);
    });
  });
};

const addNotificationSlack = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Project creation unauthorized.');
  }

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      CALL CreateNotificationSlack(
        :name,
        :webhook,
        :channel
      );
    `);

    sqlClient.query(prep(input), (err, rows) => {
      if (err) {
        rej(err);
      }

      const slack = R.path([0, 0], rows);

      res(slack);
    });
  });
};

const addNotificationToProject = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Project creation unauthorized.');
  }

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      CALL CreateProjectNotification(
        :project,
        :notificationType,
        :notificationName
      );
    `);

    sqlClient.query(prep(input), (err, rows) => {
      if (err) {
        rej(err);
      }

      const project = R.path([0, 0], rows);

      res(project);
    });
  });
};

const truncateTable = sqlClient => async (cred, args) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const { tableName } = args;

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`TRUNCATE table \`${tableName}\``);

    sqlClient.query(prep(args), (err, rows) => {
      if (err) {
        rej(err);
      }

      res('success');
    });
  });
};

const daoFns = {
  getPermissions,
  getCustomerSshKeys,
  getAllCustomers,
  getOpenshiftByProjectId,
  getProjectByGitUrl,
  getNotificationsByProjectId,
  getSshKeysByProjectId,
  getSshKeysByCustomerId,
  getCustomerByProjectId,
  getProjectByName,
  getAllProjects,
  addProject,
  addSshKey,
  addCustomer,
  addOpenshift,
  addNotificationSlack,
  addNotificationToProject,
  truncateTable,
};

// Maps all dao functions to given sqlClient
// "make" is the FP equivalent of `new Dao()` in OOP
const make = sqlClient => R.mapObjIndexed((fn, name) => fn(sqlClient), daoFns);

module.exports = {
  ...daoFns,
  make,
};
