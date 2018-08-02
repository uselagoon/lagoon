const R = require('ramda');
const {
  knex, query, prepare, isPatchEmpty,
} = require('./utils');

const { getProjectIdByName } = require('./project').Helpers;

const concatNonNull = R.reduce((acc, rows) => {
  if (rows == null) {
    return acc;
  }
  return R.concat(acc, rows);
}, []);

const Sql = {
  createProjectNotification: (cred, input) => {
    const { pid, notificationType, nid } = input;

    return knex('project_notification')
      .insert({
        pid,
        type: notificationType,
        nid,
      })
      .toString();
  },
  selectProjectNotificationByNotificationName: (cred, input) => {
    const { name, type } = input;

    return knex('project_notification AS pn')
      .joinRaw(
        `JOIN notification_${type} AS nt ON pn.nid = nt.id AND pn.type = ?`,
        [type],
      )
      .where('nt.name', '=', name)
      .select('nt.*', 'pn.*', knex.raw('? as type', [type]))
      .toString();
  },
  deleteProjectNotification: (cred, input) => {
    const { project, notificationType, notificationName } = input;

    const deleteQuery = knex('project_notification AS pn')
      .joinRaw(
        `LEFT JOIN notification_${notificationType} AS nt ON pn.nid = nt.id AND pn.type = ?`,
        [notificationType],
      )
      .leftJoin('project AS p', 'pn.pid', '=', 'p.id');

    if (cred.role !== 'admin') {
      const { projects } = cred.permissions;

      deleteQuery.whereIn('pn.pid', projects);
    }

    return deleteQuery
      .where('p.name', project)
      .andWhere('nt.name', notificationName)
      .del()
      .toString();
  },
  selectProjectById: input =>
    knex('project')
      .select('*')
      .where({
        'project.id': input,
      })
      .toString(),
  selectProjectByName: (input) => {
    const { project } = input;

    return knex('project')
      .select('*')
      .where({
        'project.name': project,
      })
      .toString();
  },
  selectProjectNotification: (input) => {
    const { project, notificationType, notificationName } = input;
    return knex({ p: 'project', nt: `notification_${notificationType}` })
      .where({ 'p.name': project })
      .andWhere({ 'nt.name': notificationName })
      .select({ pid: 'p.id', nid: 'nt.id' })
      .toString();
  },
  updateNotificationRocketChat: (cred, input) => {
    const { name, patch } = input;

    return knex('notification_rocketchat')
      .where('name', '=', name)
      .update(patch)
      .toString();
  },
  selectNotificationsByTypeByProjectId: (cred, input) => {
    const { type, pid } = input;
    const selectQuery = knex('project_notification AS pn').joinRaw(
      `JOIN notification_${type} AS nt ON pn.nid = nt.id AND pn.type = ?`,
      [type],
    );

    if (cred.role !== 'admin') {
      const { projects } = cred.permissions;
      selectQuery.whereIn('pn.pid', projects);
    }

    return selectQuery
      .where('pn.pid', '=', pid)
      .select('nt.*', 'pn.type')
      .toString();
  },
  selectNotificationRocketChatByName: name =>
    knex('notification_rocketchat')
      .where('name', '=', name)
      .toString(),
  updateNotificationSlack: (cred, input) => {
    const { name, patch } = input;

    return knex('notification_slack')
      .where('name', '=', name)
      .update(patch)
      .toString();
  },
  selectNotificationSlackByName: name =>
    knex('notification_slack')
      .where('name', '=', name)
      .toString(),
  selectUnassignedNotificationsByType: (cred, notificationType) =>
    knex(`notification_${notificationType} AS nt`)
      .leftJoin(
        knex.raw(
          'project_notification AS pn ON pn.nid = nt.id AND pn.type = ?',
          [notificationType],
        ),
      )
      .whereRaw('pn.nid IS NULL and pn.pid IS NULL')
      .select('nt.*', knex.raw('? as type', [notificationType]))
      .toString(),
  selectProjectNotificationsWithoutAccess: (cred, { nids }) => {
    const { projects } = cred.permissions;
    return knex('project_notification AS pn')
      .join('project AS p', 'pn.pid', '=', 'p.id')
      .whereIn('pn.nid', nids)
      .whereNotIn('pn.pid', projects)
      .select('pn.*')
      .toString();
  },
};

const Helpers = {
  getAssignedNotificationIds: async (sqlClient, cred, args) => {
    const { name, type } = args;

    const result = await query(
      sqlClient,
      Sql.selectProjectNotificationByNotificationName(cred, { name, type }),
    );

    return R.map(R.prop('nid'), result);
  },
  getAssignedNotificationPids: async (sqlClient, cred, args) => {
    const { name, type } = args;

    const result = await query(
      sqlClient,
      Sql.selectProjectNotificationByNotificationName(cred, { name, type }),
    );

    return R.map(R.prop('pid'), result);
  },
  isAllowedToModify: async (sqlClient, cred, args) => {
    if (cred.role === 'admin') {
      return true;
    }

    const { name } = args;
    const { projects } = cred.permissions;
    const pids = await Helpers.getAssignedNotificationPids(sqlClient, cred, {
      name,
      type: 'slack',
    });

    if (!R.isEmpty(pids)) {
      const hasAccess = R.compose(R.not, R.isEmpty, R.intersection(projects))(
        pids,
      );

      return hasAccess;
    }
    return true;
  },
};

const addNotificationRocketChat = ({ sqlClient }) => async (cred, input) => {
  const prep = prepare(
    sqlClient,
    'CALL CreateNotificationRocketChat(:name, :webhook, :channel)',
  );

  const rows = await query(sqlClient, prep(input));
  const rocketchat = R.path([0, 0], rows);

  return rocketchat;
};

const addNotificationSlack = ({ sqlClient }) => async (cred, input) => {
  const prep = prepare(
    sqlClient,
    'CALL CreateNotificationSlack(:name, :webhook, :channel)',
  );

  const rows = await query(sqlClient, prep(input));
  const slack = R.path([0, 0], rows);

  return slack;
};

const addNotificationToProject = ({ sqlClient }) => async (cred, input) => {
  const { projects } = cred.permissions;

  if (cred.role !== 'admin') {
    // Will throw on invalid conditions
    const pid = await getProjectIdByName(sqlClient, input.project);

    if (!R.contains(pid, projects)) {
      throw new Error('Unauthorized.');
    }
  }
  const rows = await query(sqlClient, Sql.selectProjectNotification(input));
  const projectNotification = R.path([0], rows);
  if (!projectNotification) {
    throw new Error(
      `Could not find notification '${input.notificationName}' of type '${
        input.notificationType
      }'`,
    );
  }
  projectNotification.notificationType = input.notificationType;

  await query(
    sqlClient,
    Sql.createProjectNotification(cred, projectNotification),
  );
  const select = await query(
    sqlClient,
    Sql.selectProjectById(projectNotification.pid),
  );
  const project = R.path([0], select);
  return project;
};

const deleteNotificationRocketChat = ({ sqlClient }) => async (cred, input) => {
  const { name } = input;

  const nids = await Helpers.getAssignedNotificationIds(sqlClient, cred, {
    name,
    type: 'slack',
  });

  if (R.length(nids) > 0) {
    const nonAllowed = await query(
      sqlClient,
      Sql.selectProjectNotificationsWithoutAccess(cred, {
        nids,
      }),
    );

    // If there are any project_notification entries, make sure
    // that there are no assigned notifications the user doesn't
    // has access to
    if (R.length(nonAllowed) > 0) {
      const ids = R.compose(R.join(','), R.map(R.prop('nid')));
      throw new Error(`Unauthorized for following projects: ${ids}`);
    }
  }

  const prep = prepare(sqlClient, 'CALL DeleteNotificationRocketChat(:name)');
  await query(sqlClient, prep(input));

  // TODO: maybe check rows for changed result
  return 'success';
};

const deleteNotificationSlack = ({ sqlClient }) => async (cred, input) => {
  const { name } = input;

  const nids = await Helpers.getAssignedNotificationIds(sqlClient, cred, {
    name,
    type: 'slack',
  });

  if (R.length(nids) > 0) {
    const nonAllowed = await query(
      sqlClient,
      Sql.selectProjectNotificationsWithoutAccess(cred, {
        nids,
      }),
    );

    // If there are any project_notification entries, make sure
    // that there are no assigned notifications the user doesn't
    // has access to
    if (R.length(nonAllowed) > 0) {
      const ids = R.compose(R.join(','), R.map(R.prop('nid')));
      throw new Error(`Unauthorized for following projects: ${ids}`);
    }
  }

  const prep = prepare(sqlClient, 'CALL DeleteNotificationSlack(:name)');
  await query(sqlClient, prep(input));

  // TODO: maybe check rows for changed result
  return 'success';
};

const removeNotificationFromProject = ({ sqlClient }) => async (cred, input) => {
  if (cred.role !== 'admin') {
    throw new Error('unauthorized.');
  }

  await query(
    sqlClient,
    Sql.deleteProjectNotification(cred, input),
  );
  const select = await query(sqlClient, Sql.selectProjectByName(input));
  const project = R.path([0], select);

  return project;
};

const NOTIFICATION_TYPES = ['slack', 'rocketchat'];

const getNotificationsByProjectId = ({ sqlClient }) => async (cred, pid, args) => {
  const { type: argsType } = args;

  // Types to collect notifications from all different
  // notification type tables
  const types = argsType == null ? NOTIFICATION_TYPES : [argsType];

  const results = await Promise.all(
    types.map(type =>
      query(
        sqlClient,
        Sql.selectNotificationsByTypeByProjectId(cred, {
          type,
          pid,
        }),
      ),
    ),
  );

  return results.reduce((acc, rows) => {
    if (rows == null) {
      return acc;
    }
    return R.concat(acc, rows);
  }, []);
};

const updateNotificationRocketChat = ({ sqlClient }) => async (cred, input) => {
  const { name } = input;

  const isAllowed = await Helpers.isAllowedToModify(sqlClient, cred, { name });
  if (!isAllowed) {
    throw new Error('Unauthorized.');
  }

  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  await query(sqlClient, Sql.updateNotificationRocketChat(cred, input));
  const rows = await query(
    sqlClient,
    Sql.selectNotificationRocketChatByName(name),
  );

  return R.prop(0, rows);
};

const updateNotificationSlack = ({ sqlClient }) => async (cred, input) => {
  const { name } = input;

  const isAllowed = await Helpers.isAllowedToModify(sqlClient, cred, { name });
  if (!isAllowed) {
    throw new Error('Unauthorized.');
  }

  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  await query(sqlClient, Sql.updateNotificationSlack(cred, input));
  const rows = await query(sqlClient, Sql.selectNotificationSlackByName(name));

  return R.prop(0, rows);
};

const getUnassignedNotifications = ({ sqlClient }) => async (cred, args) => {
  const { type: argsType } = args;
  const types = argsType == null ? NOTIFICATION_TYPES : [argsType];
  const results = await Promise.all(
    types.map(type =>
      query(sqlClient, Sql.selectUnassignedNotificationsByType(cred, type)),
    ),
  );

  return concatNonNull(results);
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
  getUnassignedNotifications,
};

module.exports = {
  Sql,
  Queries,
  Helpers,
};
