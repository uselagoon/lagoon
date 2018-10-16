// @flow

const R = require('ramda');
const sqlClient = require('../../clients/sqlClient');
const { query, prepare, isPatchEmpty } = require('../../util/db');
const { getProjectIdByName } = require('../project/helpers');
const Helpers = require('./helpers');
const Sql = require('./sql');

/* ::

import type {ResolversObj} from '../';

*/

const notificationTypeToString = R.cond([
  [R.equals('ROCKETCHAT'), R.toLower],
  [R.equals('SLACK'), R.toLower],
  [R.T, R.identity],
]);

const addNotificationRocketChat = async (root, { input }) => {
  const prep = prepare(
    sqlClient,
    'CALL CreateNotificationRocketChat(:name, :webhook, :channel)',
  );

  const rows = await query(sqlClient, prep(input));
  const rocketchat = R.path([0, 0], rows);

  return rocketchat;
};

const addNotificationSlack = async (root, { input }) => {
  const prep = prepare(
    sqlClient,
    'CALL CreateNotificationSlack(:name, :webhook, :channel)',
  );

  const rows = await query(sqlClient, prep(input));
  const slack = R.path([0, 0], rows);

  return slack;
};

const addNotificationToProject = async (
  root,
  { input: unformattedInput },
  {
    credentials: {
      role,
      permissions: { projects },
    },
  },
) => {
  const input = R.compose(
    R.over(R.lensProp('notificationType'), notificationTypeToString),
  )(unformattedInput);

  if (role !== 'admin') {
    // Will throw on invalid conditions
    const pid = await getProjectIdByName(input.project);

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

  await query(sqlClient, Sql.createProjectNotification(projectNotification));
  const select = await query(
    sqlClient,
    Sql.selectProjectById(projectNotification.pid),
  );
  const project = R.path([0], select);
  return project;
};

const deleteNotificationRocketChat = async (
  root,
  { input },
  {
    credentials: {
      permissions: { projects },
    },
  },
) => {
  const { name } = input;

  const nids = await Helpers.getAssignedNotificationIds({
    name,
    type: 'slack',
  });

  if (R.length(nids) > 0) {
    const nonAllowed = await query(
      sqlClient,
      Sql.selectProjectNotificationsWithoutAccess(
        { permissions: { projects } },
        {
          nids,
        },
      ),
    );

    // If there are any project_notification entries, make sure
    // that there are no assigned notifications the user doesn't
    // has access to
    if (R.length(nonAllowed) > 0) {
      const ids = R.compose(
        R.join(','),
        R.map(R.prop('nid')),
      )(nonAllowed);
      throw new Error(`Unauthorized for following projects: ${ids}`);
    }
  }

  const prep = prepare(sqlClient, 'CALL DeleteNotificationRocketChat(:name)');
  await query(sqlClient, prep(input));

  // TODO: maybe check rows for changed result
  return 'success';
};

const deleteNotificationSlack = async (
  root,
  { input },
  {
    credentials: {
      permissions: { projects },
    },
  },
) => {
  const { name } = input;

  const nids = await Helpers.getAssignedNotificationIds({
    name,
    type: 'slack',
  });

  if (R.length(nids) > 0) {
    const nonAllowed = await query(
      sqlClient,
      Sql.selectProjectNotificationsWithoutAccess(
        { permissions: { projects } },
        {
          nids,
        },
      ),
    );

    // If there are any project_notification entries, make sure
    // that there are no assigned notifications the user doesn't
    // has access to
    if (R.length(nonAllowed) > 0) {
      const ids = R.compose(
        R.join(','),
        R.map(R.prop('nid')),
      )(nonAllowed);
      throw new Error(`Unauthorized for following projects: ${ids}`);
    }
  }

  const prep = prepare(sqlClient, 'CALL DeleteNotificationSlack(:name)');
  await query(sqlClient, prep(input));

  // TODO: maybe check rows for changed result
  return 'success';
};

const removeNotificationFromProject = async (
  root,
  { input: unformattedInput },
  {
    credentials: {
      role,
      permissions: { projects },
    },
  },
) => {
  const input = R.compose(
    R.over(R.lensProp('notificationType'), notificationTypeToString),
  )(unformattedInput);

  if (role !== 'admin') {
    throw new Error('unauthorized.');
  }

  await query(
    sqlClient,
    Sql.deleteProjectNotification(
      { credentials: { role, permissions: { projects } } },
      input,
    ),
  );
  const select = await query(sqlClient, Sql.selectProjectByName(input));
  const project = R.path([0], select);

  return project;
};

const NOTIFICATION_TYPES = ['slack', 'rocketchat'];

const getNotificationsByProjectId = async (
  { id: pid },
  unformattedArgs,
  {
    credentials: {
      role,
      permissions: { projects },
    },
  },
) => {
  const args = R.compose(R.over(R.lensProp('type'), notificationTypeToString))(
    unformattedArgs,
  );

  const { type: argsType } = args;

  // Types to collect notifications from all different
  // notification type tables
  const types = argsType == null ? NOTIFICATION_TYPES : [argsType];

  const results = await Promise.all(
    types.map(type =>
      query(
        sqlClient,
        Sql.selectNotificationsByTypeByProjectId(
          { credentials: { role, permissions: { projects } } },
          {
            type,
            pid,
          },
        ),
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

const updateNotificationRocketChat = async (
  root,
  { input },
  {
    credentials: {
      role,
      permissions: { projects },
    },
  },
) => {
  const { name } = input;

  const isAllowed = await Helpers.isAllowedToModify(
    { role, permissions: { projects } },
    { name },
  );
  if (!isAllowed) {
    throw new Error('Unauthorized.');
  }

  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  await query(sqlClient, Sql.updateNotificationRocketChat(input));
  const rows = await query(
    sqlClient,
    Sql.selectNotificationRocketChatByName(name),
  );

  return R.prop(0, rows);
};

const updateNotificationSlack = async (
  root,
  { input },
  {
    credentials: {
      role,
      permissions: { projects },
    },
  },
) => {
  const { name } = input;

  const isAllowed = await Helpers.isAllowedToModify(
    { role, permissions: { projects } },
    { name },
  );
  if (!isAllowed) {
    throw new Error('Unauthorized.');
  }

  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  await query(sqlClient, Sql.updateNotificationSlack(input));
  const rows = await query(sqlClient, Sql.selectNotificationSlackByName(name));

  return R.prop(0, rows);
};

const deleteAllNotificationSlacks = async (
  root,
  args,
  { credentials: { role } },
) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  await query(sqlClient, Sql.truncateNotificationSlack());

  // TODO: Check rows for success
  return 'success';
};

const deleteAllNotificationRocketChats = async (
  root,
  args,
  { credentials: { role } },
) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  await query(sqlClient, Sql.truncateNotificationRocketchat());

  // TODO: Check rows for success
  return 'success';
};

const removeAllNotificationsFromAllProjects = async (
  root,
  args,
  { credentials: { role } },
) => {
  if (role !== 'admin') {
    throw new Error('Unauthorized.');
  }

  await query(sqlClient, Sql.truncateProjectNotification());

  // TODO: Check rows for success
  return 'success';
};

const Resolvers /* : ResolversObj */ = {
  addNotificationRocketChat,
  addNotificationSlack,
  addNotificationToProject,
  deleteNotificationRocketChat,
  deleteNotificationSlack,
  getNotificationsByProjectId,
  removeNotificationFromProject,
  updateNotificationRocketChat,
  updateNotificationSlack,
  deleteAllNotificationSlacks,
  deleteAllNotificationRocketChats,
  removeAllNotificationsFromAllProjects,
};

module.exports = Resolvers;
