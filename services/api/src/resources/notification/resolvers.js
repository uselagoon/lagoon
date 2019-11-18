// @flow

const R = require('ramda');
const { query, prepare, isPatchEmpty } = require('../../util/db');
const projectHelpers = require('../project/helpers');
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

const addNotificationRocketChat = async (root, { input }, { sqlClient, hasPermission }) => {
  await hasPermission('notification', 'add');

  const prep = prepare(
    sqlClient,
    'CALL CreateNotificationRocketChat(:name, :webhook, :channel)',
  );

  const rows = await query(sqlClient, prep(input));
  const rocketchat = R.path([0, 0], rows);

  return rocketchat;
};

const addNotificationSlack = async (root, { input }, { sqlClient, hasPermission }) => {
  await hasPermission('notification', 'add');

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
    sqlClient,
    hasPermission,
  },
) => {
  const input = R.compose(
    R.over(R.lensProp('notificationType'), notificationTypeToString),
  )(unformattedInput);

  const pid = await projectHelpers(sqlClient).getProjectIdByName(input.project);
  await hasPermission('project', 'addNotification', {
    project: pid,
  });

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
    sqlClient,
    hasPermission,
  },
) => {
  await hasPermission('notification', 'delete');

  const { name } = input;

  const nids = await Helpers(sqlClient).getAssignedNotificationIds({
    name,
    type: 'slack',
  });

  if (R.length(nids) > 0) {
    throw new Error("Can't delete notification linked to projects");
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
    sqlClient,
    hasPermission,
  },
) => {
  await hasPermission('notification', 'delete');

  const { name } = input;

  const nids = await Helpers(sqlClient).getAssignedNotificationIds({
    name,
    type: 'slack',
  });

  if (R.length(nids) > 0) {
    throw new Error("Can't delete notification linked to projects");
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
    sqlClient,
    hasPermission,
  },
) => {
  const input = R.compose(
    R.over(R.lensProp('notificationType'), notificationTypeToString),
  )(unformattedInput);

  const select = await query(sqlClient, Sql.selectProjectByName(input));
  const project = R.path([0], select);

  await hasPermission('project', 'removeNotification', {
    project: project.id,
  });

  await query(
    sqlClient,
    Sql.deleteProjectNotification(input),
  );

  return project;
};

const NOTIFICATION_TYPES = ['slack', 'rocketchat'];

const getNotificationsByProjectId = async (
  { id: pid },
  unformattedArgs,
  {
    sqlClient,
    hasPermission,
  },
) => {
  await hasPermission('notification', 'view', {
    project: pid,
  });

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
    sqlClient,
    hasPermission,
  },
) => {
  await hasPermission('notification', 'update');

  const { name } = input;

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
    sqlClient,
    hasPermission,
  },
) => {
  await hasPermission('notification', 'update');

  const { name } = input;

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
  { sqlClient, hasPermission },
) => {
  await hasPermission('notification', 'deleteAll');

  await query(sqlClient, Sql.truncateNotificationSlack());

  // TODO: Check rows for success
  return 'success';
};

const deleteAllNotificationRocketChats = async (
  root,
  args,
  { sqlClient, hasPermission },
) => {
  await hasPermission('notification', 'deleteAll');

  await query(sqlClient, Sql.truncateNotificationRocketchat());

  // TODO: Check rows for success
  return 'success';
};

const removeAllNotificationsFromAllProjects = async (
  root,
  args,
  { sqlClient, hasPermission },
) => {
  await hasPermission('notification', 'removeAll');

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
