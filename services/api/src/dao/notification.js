const R = require('ramda');
const {
  knex,
  ifNotAdmin,
  whereAnd,
  inClause,
  inClauseOr,
  query,
  prepare,
  isPatchEmpty,
} = require('./utils');

const Sql = {
  createProjectNotification: (cred, input) => {
    const { pid, notificationType, nid } = input;

    return knex('project_notification')
      .insert({
        "pid": pid,
        "type": notificationType,
        "nid": nid,
      })
      .toString();
  },
  selectProjectById: (input) => {

    return knex('project')
      .select('*')
      .where({
        'project.id': input
      })
      .toString();
  },
  selectProjectNotification: (input) => {
    const { project, notificationType, notificationName} = input;
    return knex({p: 'project', nt: "notification_" + notificationType})
      .where({'p.name': project})
      .andWhere({'nt.name': notificationName})
      .select({pid: 'p.id', nid: 'nt.id'})
      .toString();
  },
  updateNotificationRocketChat: (cred, input) => {
    const { name, patch } = input;

    return knex('notification_rocketchat')
      .where('name', '=', name)
      .update(patch)
      .toString();
  },
  selectNotificationRocketChatByName: name => {
    return knex('notification_rocketchat')
      .where('name', '=', name)
      .toString();
  },
  updateNotificationSlack: (cred, input) => {
    const { name, patch } = input;

    return knex('notification_slack')
      .where('name', '=', name)
      .update(patch)
      .toString();
  },
  selectNotificationSlackByName: name => {
    return knex('notification_slack')
      .where('name', '=', name)
      .toString();
  },
};

const addNotificationRocketChat = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Project creation unauthorized.');
  }

  const prep = prepare(
    sqlClient,
    'CALL CreateNotificationRocketChat(:name, :webhook, :channel)',
  );

  const rows = await query(sqlClient, prep(input));
  const rocketchat = R.path([0, 0], rows);

  return rocketchat;
};

const addNotificationSlack = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Project creation unauthorized.');
  }

  const prep = prepare(
    sqlClient,
    'CALL CreateNotificationSlack(:name, :webhook, :channel)',
  );

  const rows = await query(sqlClient, prep(input));
  const slack = R.path([0, 0], rows);

  return slack;
};

const addNotificationToProject = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Project creation unauthorized.');
  }

  const rows = await query(sqlClient, Sql.selectProjectNotification(input));
  const projectNotification = R.path([0], rows);
  projectNotification.notificationType = input.notificationType;

  const result = await query(sqlClient, Sql.createProjectNotification(cred, projectNotification));
  const select = await query(sqlClient, Sql.selectProjectById(projectNotification['pid']));
  const project = R.path([0],select);
  return project;
};

const deleteNotificationRocketChat = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Project creation unauthorized.');
  }

  const prep = prepare(sqlClient, 'CALL DeleteNotificationRocketChat(:name)');
  const rows = await query(sqlClient, prep(input));

  // TODO: maybe check rows for changed result
  return 'success';
};

const deleteNotificationSlack = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Project creation unauthorized.');
  }

  const prep = prepare(sqlClient, 'CALL DeleteNotificationSlack(:name)');
  const rows = await query(sqlClient, prep(input));

  // TODO: maybe check rows for changed result
  return 'success';
};

const removeNotificationFromProject = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('unauthorized.');
  }
  const prep = prepare(
    sqlClient,
    'CALL DeleteProjectNotification(:project, :notificationType, :notificationName)',
  );
  const rows = await query(sqlClient, prep(input));
  const project = R.path([0, 0], rows);

  return project;
};

const getNotificationsByProjectId = sqlClient => async (cred, pid, args) => {
  const { customers, projects } = cred.permissions;
  const prep = prepare(
    sqlClient,
    `SELECT
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
        ${ifNotAdmin(
          cred.role,
          `AND (${inClauseOr([
            ['p.customer', customers],
            ['p.id', projects],
          ])})`,
        )}
    `,
  );

  const rows = await query(
    sqlClient,
    prep({
      pid: pid,
      type: args.type,
    }),
  );

  return rows ? rows : null;
};

const updateNotificationRocketChat = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Project creation unauthorized.');
  }

  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  const name = input.name;

  await query(sqlClient, Sql.updateNotificationRocketChat(cred, input));
  const rows = await query(sqlClient, Sql.selectNotificationRocketChatByName(name));

  return R.prop(0, rows);
};

const updateNotificationSlack = sqlClient => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('Project creation unauthorized.');
  }

  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  const name = input.name;

  await query(sqlClient, Sql.updateNotificationSlack(cred, input));
  const rows = await query(sqlClient, Sql.selectNotificationSlackByName(name));

  return R.prop(0, rows);
};

const Queries = {
  addNotificationRocketChat,
  addNotificationSlack,
  addNotificationToProject,
  deleteNotificationRocketChat,
  deleteNotificationSlack,
  getNotificationsByProjectId,
  removeNotificationFromProject,
  updateNotificationRocketChat,
  updateNotificationSlack,
};

module.exports = {
  Sql,
  Queries,
};
