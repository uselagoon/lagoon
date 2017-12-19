// ATTENTION:
// The `sqlClient` part is usually curried in our application

const R = require('ramda');
const promisify = require('util').promisify;

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
      }
    );
  });
};

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

const getAllOpenshifts = sqlClient => async (cred, args) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const { createdAfter } = args;

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      SELECT * FROM openshift`);

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
        *
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

const getNotificationsByProjectId = sqlClient => async (cred, pid, args) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      SELECT
        ns.id,
        ns.name,
        ns.webhook,
        ns.channel,
        pn.type
      FROM
        project_notification AS pn
      JOIN
        notification_slack AS ns ON (pn.nid = ns.id)
      WHERE
        pn.pid = :pid
        ${args.type ? 'AND pn.type = :type' : ''}
    `);

    sqlClient.query(prep({ pid: pid, type: args.type }), (err, rows) => {
      if (err) {
        rej(err);
      }

      const ret = rows ? rows : null;
      console.log(ret);
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

const getEnvironmentsByProjectId = sqlClient => async (cred, pid) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      SELECT
        *
      FROM environment e
      WHERE e.project = :pid
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

const getProjectByEnvironmentId = sqlClient => async (cred, eid) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      SELECT
        p.*
      FROM environment e
      JOIN project p ON e.project = p.id
      WHERE e.id = :eid
    `);

    sqlClient.query(prep({ eid }), (err, rows) => {
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
        ${input.active_systems_deploy
          ? ':active_systems_deploy'
          : '"lagoon_openshiftBuildDeploy"'},
        ${input.active_systems_remove
          ? ':active_systems_remove'
          : '"lagoon_openshiftRemove"'},
        ${input.branches ? ':branches' : '"true"'},
        ${input.pullrequests
          ? "IF(STRCMP(:pullrequests, 'true'), 1, 0)"
          : 'NULL'},
        ${input.production_environment
          ? ':production_environment'
          : 'NULL'},
        '${input.sshKeys ? input.sshKeys.join(',') : ''}'
      );
    `);

    sqlClient.query(prep(input), (err, rows) => {
      if (err) {
        console.log(prep(input));
        console.log(err);
        rej(err);
      }

      // TODO: Maybe resolve IDs from customer, slack, openshift, sshKeys?
      // Not really necessary for a MVP right now IMO
      const project = R.path([0, 0], rows);

      res(project);
    });
  });
};

const deleteProject = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      CALL DeleteProject(
        :name
      );
    `);

    sqlClient.query(prep(input), (err, rows) => {
      if (err) {
        rej(err);
      }

      res('success');
    });
  });
}

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
        console.log(err);
        rej(err);
      }

      const ssh_key = R.path([0, 0], rows);

      res(ssh_key);
    });
  });
};

const deleteSshKey = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      CALL deleteSshKey(
        :name
      );
    `);

    sqlClient.query(prep(input), (err, rows) => {
      if (err) {
        console.log(err);
        rej(err);
      }

      res('success');
    });
  });
}

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
        console.log(err);
        rej(err);
      }

      const customer = R.path([0, 0], rows);

      res(customer);
    });
  });
};

const deleteCustomer = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      CALL deleteCustomer(
        :name
      );
    `);

    sqlClient.query(prep(input), (err, rows) => {
      if (err) {
        console.log(err);
        rej(err);
      }

      res('success');
    });
  });
}

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
        ${input.project_user ? ':project_user' : 'NULL'},
        ${input.ssh_host ? ':ssh_host' : 'NULL'},
        ${input.ssh_port ? ':ssh_host' : 'NULL'}
      );
    `);

    sqlClient.query(prep(input), (err, rows) => {
      if (err) {
        console.log(err);
        rej(err);
      }

      const openshift = R.path([0, 0], rows);

      res(openshift);
    });
  });
};

const addOrUpdateEnvironment = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Project creation unauthorized.');
  }

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      CALL CreateOrUpdateEnvironment(
        :name,
        :project,
        :git_type,
        :environment_type,
        :openshift_projectname
      );
    `);

    sqlClient.query(prep(input), (err, rows) => {
      if (err) {
        console.log(err);
        rej(err);
      }

      const environment = R.path([0, 0], rows);

      res(environment);
    });
  });
};

const deleteEnvironment = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      CALL DeleteEnvironment(
        :name,
        :project
      );
    `);

    sqlClient.query(prep(input), (err, rows) => {
      if (err) {
        rej(err);
      }

      res('success');
    });
  });
}

const deleteOpenshift = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      CALL deleteOpenshift(
        :name
      );
    `);

    sqlClient.query(prep(input), (err, rows) => {
      if (err) {
        rej(err);
      }

      res('success');
    });
  });
}

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
        console.log(err);
        rej(err);
      }

      const slack = R.path([0, 0], rows);

      res(slack);
    });
  });
};

const deleteNotificationSlack = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Project creation unauthorized.');
  }

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      CALL DeleteNotificationSlack(
        :name
      );
    `);

    sqlClient.query(prep(input), (err, rows) => {
      if (err) {
        rej(err);
      }

      res('success');
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
        console.log(prep(input));
        console.log(err);
        rej(err);
      }

      const project = R.path([0, 0], rows);

      res(project);
    });
  });
};

const removeNotificationFromProject = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('unauthorized.');
  }

  return new Promise((res, rej) => {
    const prep = sqlClient.prepare(`
      CALL DeleteProjectNotification(
        :project,
        :notificationType,
        :notificationName
      );
    `);

    sqlClient.query(prep(input), (err, rows) => {
      if (err) {
        console.log(prep(input));
        console.log(err);
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
    const prep = sqlClient.prepare(`
      TRUNCATE table \`${tableName}\`;
    `);

    sqlClient.query(prep(args), (err, rows) => {
      if (err) {
        console.log(prep(args));
        rej(err);
      }

      res('success');
    });
  });
};

const daoFns = {
  getCustomerSshKeys,
  getAllCustomers,
  getAllOpenshifts,
  getOpenshiftByProjectId,
  getProjectByEnvironmentId,
  getEnvironmentsByProjectId,
  getProjectByGitUrl,
  getNotificationsByProjectId,
  getSshKeysByProjectId,
  getSshKeysByCustomerId,
  getCustomerByProjectId,
  getProjectByName,
  getAllProjects,
  addProject,
  deleteProject,
  addSshKey,
  deleteSshKey,
  addCustomer,
  deleteCustomer,
  addOpenshift,
  deleteOpenshift,
  addNotificationSlack,
  deleteNotificationSlack,
  addNotificationToProject,
  removeNotificationFromProject,
  addOrUpdateEnvironment,
  deleteEnvironment,
  truncateTable,
};

// Maps all dao functions to given sqlClient
// "make" is the FP equivalent of `new Dao()` in OOP
const make = sqlClient => R.mapObjIndexed((fn, name) => fn(sqlClient), daoFns);

module.exports = {
  ...daoFns,
  make,
};
