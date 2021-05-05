import * as R from 'ramda';
import { ResolverFn } from '../';
import { mQuery, isPatchEmpty } from '../../util/db';
import { Helpers as projectHelpers } from '../project/helpers';
import { Helpers } from './helpers';
import { Sql } from './sql';
import { Sql as projectSql } from '../project/sql';
import {
  NOTIFICATION_CONTENT_TYPE,
  NOTIFICATION_SEVERITY_THRESHOLD
} from './defaults';
import {
  notificationIntToContentType,
  notificationContentTypeToInt
} from '@lagoon/commons/dist/notificationCommons';

export const addNotificationMicrosoftTeams: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('notification', 'add');

  const rows = await mQuery(
    sqlClientPool,
    'CALL CreateNotificationMicrosoftTeams(:name, :webhook)',
    input
  );
  const microsoftTeams = R.path([0, 0], rows);

  return microsoftTeams;
};

export const addNotificationEmail: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('notification', 'add');

  const rows = await mQuery(
    sqlClientPool,
    'CALL CreateNotificationEmail(:name, :email_address)',
    input
  );
  const email = R.path([0, 0], rows);

  return email;
};

export const addNotificationRocketChat: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('notification', 'add');

  const rows = await mQuery(
    sqlClientPool,
    'CALL CreateNotificationRocketChat(:name, :webhook, :channel)',
    input
  );
  const rocketchat = R.path([0, 0], rows);

  return rocketchat;
};

export const addNotificationSlack: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('notification', 'add');

  const rows = await mQuery(
    sqlClientPool,
    'CALL CreateNotificationSlack(:name, :webhook, :channel)',
    input
  );
  const slack = R.path([0, 0], rows);

  return slack;
};

export const addNotificationToProject: ResolverFn = async (
  root,
  { input: unformattedInput },
  { sqlClientPool, hasPermission }
) => {
  const input = [
    R.over(
      R.lensProp('notificationSeverityThreshold'),
      notificationContentTypeToInt
    )
  ].reduce(
    (argumentsToProcess, functionToApply) =>
      functionToApply(argumentsToProcess),
    unformattedInput
  );

  const pid = await projectHelpers(sqlClientPool).getProjectIdByName(
    input.project
  );
  await hasPermission('project', 'addNotification', {
    project: pid
  });

  const rows = await mQuery(
    sqlClientPool,
    Sql.selectProjectNotification(input)
  );
  const projectNotification = R.path([0], rows) as any;
  if (!projectNotification) {
    throw new Error(
      `Could not find notification '${input.notificationName}' of type '${input.notificationType}'`
    );
  }
  projectNotification.notificationType = input.notificationType;
  projectNotification.contentType =
    input.contentType || NOTIFICATION_CONTENT_TYPE;
  projectNotification.notificationSeverityThreshold =
    input.notificationSeverityThreshold || NOTIFICATION_SEVERITY_THRESHOLD;

  await mQuery(
    sqlClientPool,
    Sql.createProjectNotification(projectNotification)
  );
  const select = await mQuery(
    sqlClientPool,
    Sql.selectProjectById(projectNotification.pid)
  );
  const project = R.path([0], select);
  return project;
};

export const deleteNotificationMicrosoftTeams: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('notification', 'delete');

  const { name } = input;

  const nids = await Helpers(sqlClientPool).getAssignedNotificationIds({
    name,
    type: 'microsoftTeams'
  });

  if (R.length(nids) > 0) {
    throw new Error("Can't delete notification linked to projects");
  }

  await mQuery(
    sqlClientPool,
    'CALL DeleteNotificationMicrosoftTeams(:name)',
    input
  );

  // TODO: maybe check rows for changed result
  return 'success';
};

export const deleteNotificationEmail: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('notification', 'delete');

  const { name } = input;

  const nids = await Helpers(sqlClientPool).getAssignedNotificationIds({
    name,
    type: 'email'
  });

  if (R.length(nids) > 0) {
    throw new Error("Can't delete notification linked to projects");
  }

  await mQuery(sqlClientPool, 'CALL DeleteNotificationEmail(:name)', input);

  // TODO: maybe check rows for changed result
  return 'success';
};

export const deleteNotificationRocketChat: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('notification', 'delete');

  const { name } = input;

  const nids = await Helpers(sqlClientPool).getAssignedNotificationIds({
    name,
    type: 'rocketchat'
  });

  if (R.length(nids) > 0) {
    throw new Error("Can't delete notification linked to projects");
  }

  await mQuery(
    sqlClientPool,
    'CALL DeleteNotificationRocketChat(:name)',
    input
  );

  // TODO: maybe check rows for changed result
  return 'success';
};

export const deleteNotificationSlack: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('notification', 'delete');

  const { name } = input;

  const nids = await Helpers(sqlClientPool).getAssignedNotificationIds({
    name,
    type: 'slack'
  });

  if (R.length(nids) > 0) {
    throw new Error("Can't delete notification linked to projects");
  }

  await mQuery(sqlClientPool, 'CALL DeleteNotificationSlack(:name)', input);

  // TODO: maybe check rows for changed result
  return 'success';
};

export const removeNotificationFromProject: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission }
) => {
  const select = await mQuery(
    sqlClientPool,
    projectSql.selectProjectByName(input.project)
  );
  const project = R.path([0], select) as any;

  await hasPermission('project', 'removeNotification', {
    project: project.id
  });

  await mQuery(sqlClientPool, Sql.deleteProjectNotification(input));

  return project;
};

const NOTIFICATION_TYPES = ['slack', 'rocketchat', 'microsoftteams', 'email'];

export const getNotificationsByProjectId: ResolverFn = async (
  { id: pid },
  unformattedArgs,
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('notification', 'view', {
    project: pid
  });

  const args = [
    R.over(
      R.lensProp('notificationSeverityThreshold'),
      notificationContentTypeToInt
    )
  ].reduce(
    (argumentsToProcess, functionToApply) =>
      functionToApply(argumentsToProcess),
    unformattedArgs
  );

  const {
    type: argsType,
    contentType = NOTIFICATION_CONTENT_TYPE,
    notificationSeverityThreshold = NOTIFICATION_SEVERITY_THRESHOLD
  } = args;

  // Types to collect notifications from all different
  // notification type tables
  const types = argsType == null ? NOTIFICATION_TYPES : [argsType];

  const results = await Promise.all(
    types.map(type =>
      mQuery(
        sqlClientPool,
        Sql.selectNotificationsByTypeByProjectId({
          type,
          pid,
          contentType,
          notificationSeverityThreshold
        })
      )
    )
  );

  let resultArray = results.reduce((acc, rows) => {
    if (rows == null) {
      return acc;
    }
    return R.concat(acc, rows);
  }, []);

  return resultArray.map(e =>
    R.over(
      R.lensProp('notificationSeverityThreshold'),
      notificationIntToContentType,
      e
    )
  );
};

export const updateNotificationMicrosoftTeams: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('notification', 'update');

  const { name } = input;

  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  await mQuery(sqlClientPool, Sql.updateNotificationMicrosoftTeams(input));
  const rows = await mQuery(
    sqlClientPool,
    Sql.selectNotificationMicrosoftTeamsByName(name)
  );

  return R.prop(0, rows);
};

export const updateNotificationEmail: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('notification', 'update');

  const { name } = input;

  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  await mQuery(sqlClientPool, Sql.updateNotificationEmail(input));
  const rows = await mQuery(
    sqlClientPool,
    Sql.selectNotificationEmailByName(name)
  );

  return R.prop(0, rows);
};

export const updateNotificationRocketChat: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('notification', 'update');

  const { name } = input;

  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  await mQuery(sqlClientPool, Sql.updateNotificationRocketChat(input));
  const rows = await mQuery(
    sqlClientPool,
    Sql.selectNotificationRocketChatByName(name)
  );

  return R.prop(0, rows);
};

export const updateNotificationSlack: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('notification', 'update');

  const { name } = input;

  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }

  await mQuery(sqlClientPool, Sql.updateNotificationSlack(input));
  const rows = await mQuery(
    sqlClientPool,
    Sql.selectNotificationSlackByName(name)
  );

  return R.prop(0, rows);
};

export const deleteAllNotificationSlacks: ResolverFn = async (
  root,
  args,
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('notification', 'deleteAll');

  await mQuery(sqlClientPool, Sql.truncateNotificationSlack());

  // TODO: Check rows for success
  return 'success';
};

export const deleteAllNotificationEmails: ResolverFn = async (
  root,
  args,
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('notification', 'deleteAll');

  await mQuery(sqlClientPool, Sql.truncateNotificationEmail());

  // TODO: Check rows for success
  return 'success';
};

export const deleteAllNotificationRocketChats: ResolverFn = async (
  root,
  args,
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('notification', 'deleteAll');

  await mQuery(sqlClientPool, Sql.truncateNotificationRocketchat());

  // TODO: Check rows for success
  return 'success';
};

export const deleteAllNotificationMicrosoftTeams: ResolverFn = async (
  root,
  args,
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('notification', 'deleteAll');

  await mQuery(sqlClientPool, Sql.truncateNotificationMicrosoftTeams());

  // TODO: Check rows for success
  return 'success';
};

export const removeAllNotificationsFromAllProjects: ResolverFn = async (
  root,
  args,
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('notification', 'removeAll');

  await mQuery(sqlClientPool, Sql.truncateProjectNotification());

  // TODO: Check rows for success
  return 'success';
};
