import * as R from 'ramda';
import { ResolverFn } from '../';
import { query, isPatchEmpty, knex } from '../../util/db';
import { Helpers as projectHelpers } from '../project/helpers';
import { Helpers as organizationHelpers } from '../organization/helpers';
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
import { sqlClientPool } from '../../clients/sqlClient';
import { AuditType } from '@lagoon/commons/dist/types';
import { AuditLog, AuditResource } from '../audit/types';

const DISABLE_NON_ORGANIZATION_NOTIFICATION_ASSIGNMENT = process.env.DISABLE_NON_ORGANIZATION_NOTIFICATION_ASSIGNMENT || "false"

const addNotificationGeneric = async (sqlClientPool, userActivityLogger, notificationTable, type, input) => {
  const createSql = knex(notificationTable).insert(input).toString();

  let insertId: number;
  try {
     ({insertId} = await query(sqlClientPool, createSql));
  } catch(error) {
    if(error.text.includes("Duplicate entry")){
      throw new Error(
        `Error adding notification ${input.name}. Notification already exists`
      )
    } else {
      throw new Error(error.message);
    }
  };

  const notificationResource: AuditResource = {
    id: insertId.toString(),
    type: AuditType.NOTIFICATION,
    details: input.name,
  };
  const auditLog: AuditLog = {
    resource: notificationResource,
  };
  if (input.organization) {
    auditLog.resource = {
      id: input.organization.toString(),
      type: AuditType.ORGANIZATION,
    };
    auditLog.linkedResource = notificationResource;
    auditLog.organizationId = input.organization;
  }
  userActivityLogger(`User added a ${type} notification`, {
    project: '',
    event: `api:addNotification${type}`,
    payload: {
      ...auditLog
    }
  });

  return await query(sqlClientPool, knex(notificationTable).where('id', insertId).toString());
}

const checkOrgNotificationPermission = async (hasPermission, input, adminScopes) => {
  if (input.organization != null) {
    const organizationData = await organizationHelpers(sqlClientPool).getOrganizationById(input.organization);
    if (organizationData === undefined) {
      throw new Error(`Organization does not exist`)
    }

    await hasPermission('organization', 'addNotification', {
      organization: input.organization
    });

    const orgNotifications = await organizationHelpers(sqlClientPool).getNotificationsForOrganizationId(input.organization);
    if (orgNotifications.length >= organizationData.quotaNotification && organizationData.quotaNotification != -1) {
      throw new Error(
        `This would exceed this organizations notification quota; ${orgNotifications.length}/${organizationData.quotaNotification}`
      );
    }
  } else {
    if (DISABLE_NON_ORGANIZATION_NOTIFICATION_ASSIGNMENT == "false" || adminScopes.platformOwner) {
      await hasPermission('notification', 'add');
    } else {
      throw new Error(
        'Project notification assignment is restricted to organizations only'
      );
    }
  }
}

export const addNotificationMicrosoftTeams: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission, adminScopes, userActivityLogger}
) => {
  await checkOrgNotificationPermission(hasPermission, input, adminScopes)
  return R.path([0], await addNotificationGeneric(sqlClientPool, userActivityLogger, 'notification_microsoftteams', 'MicrosoftTeams', input));
};

export const addNotificationEmail: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission, adminScopes, userActivityLogger}
) => {
  await checkOrgNotificationPermission(hasPermission, input, adminScopes)
  return R.path([0], await addNotificationGeneric(sqlClientPool, userActivityLogger, 'notification_email', 'Email', input));
};

export const addNotificationRocketChat: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission, adminScopes, userActivityLogger}
) => {
  await checkOrgNotificationPermission(hasPermission, input, adminScopes)
  return R.path([0], await addNotificationGeneric(sqlClientPool, userActivityLogger, 'notification_rocketchat', 'RocketChat', input));
};

export const addNotificationSlack: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission, adminScopes, userActivityLogger}
) => {
  await checkOrgNotificationPermission(hasPermission, input, adminScopes)
  return R.path([0], await addNotificationGeneric(sqlClientPool, userActivityLogger, 'notification_slack', 'Slack', input));
};

export const addNotificationWebhook: ResolverFn = async (root, { input }, { sqlClientPool, hasPermission, adminScopes, userActivityLogger}) => {
  await checkOrgNotificationPermission(hasPermission, input, adminScopes)
  return R.path([0], await addNotificationGeneric(sqlClientPool, userActivityLogger, 'notification_webhook', 'Webhook', input));
};


export const addNotificationToProject: ResolverFn = async (
  root,
  { input: unformattedInput },
  { sqlClientPool, hasPermission, userActivityLogger }
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
  const projectData = await projectHelpers(sqlClientPool).getProjectById(pid)

  const rows = await query(
    sqlClientPool,
    Sql.selectProjectNotification(input)
  );
  const projectNotification = R.path([0], rows) as any;
  let noproject = false
  if (!projectNotification) {
    noproject = true
  }

  // if a project is configured with organizations
  // only organization permissions should be able to add notifications to it
  if (projectNotification.oid != null) {
    await hasPermission('organization', 'addNotification', {
      organization: projectNotification.oid
    });
  } else {
    await hasPermission('project', 'addNotification', {
      project: pid
    });
  }
  if (noproject) {
    throw new Error(
      `Could not find notification '${input.notificationName}' of type '${input.notificationType}'`
    );
  }
  projectNotification.notificationType = input.notificationType;
  projectNotification.contentType =
    input.contentType || NOTIFICATION_CONTENT_TYPE;
  projectNotification.notificationSeverityThreshold =
    input.notificationSeverityThreshold || NOTIFICATION_SEVERITY_THRESHOLD;

  const auditLog: AuditLog = {
    resource: {
      id: projectData.id.toString(),
      type: AuditType.PROJECT,
      details: projectData.name,
    },
    linkedResource: {
      id: projectNotification.nid.toString(),
      type: AuditType.NOTIFICATION,
    },
  };
  if (projectData.organization) {
    auditLog.organizationId = projectData.organization;
  }
  userActivityLogger(`User added a notification to project '${pid}'`, {
    project: '',
    event: 'api:addNotificationToProject',
    payload: {
      projectNotification,
      ...auditLog,
    }
  });

  await query(
    sqlClientPool,
    Sql.createProjectNotification(projectNotification)
  );
  const select = await query(
    sqlClientPool,
    Sql.selectProjectById(projectNotification.pid)
  );
  const project = R.path([0], select);
  return project;
};

const deleteNotificationGeneric = async (sqlClientPool, notificationTableName, typename, name) => {
  let res = await query(sqlClientPool, knex(notificationTableName).where('name', name).toString());
  let nsid = R.path([0, "id"], res);
  if(!nsid) {
    throw Error(`Notification of name ${name} not found`);
  }
  await query(sqlClientPool, knex('project_notification').where('nid', nsid).andWhere('type', typename).delete().toString());
  await query(sqlClientPool, knex(notificationTableName).where('name', name).delete().toString());
}

const checkNotificationRemovePermissions = async (check, hasPermission) => {
  if (R.prop(0, check).organization != null) {
    await hasPermission('organization', 'removeNotification', {
      organization: R.prop(0, check).organization
    });
  } else {
    await hasPermission('notification', 'delete');
  }
}


export const deleteNotificationMicrosoftTeams: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission }
) => {
  const { name } = input;
  const check = await query(
    sqlClientPool,
    Sql.selectNotificationMicrosoftTeamsByName(name)
  );
  await checkNotificationRemovePermissions(check, hasPermission)

  const nids = await Helpers(sqlClientPool).getAssignedNotificationIds({
    name,
    type: 'microsoftteams'
  });

  if (R.length(nids) > 0) {
    throw new Error("Can't delete notification linked to projects");
  }

  await deleteNotificationGeneric(sqlClientPool, 'notification_microsoftteams', 'microsoftteams', name);

  // TODO: maybe check rows for changed result
  return 'success';
};

export const deleteNotificationEmail: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission }
) => {
  const { name } = input;
  const check = await query(
    sqlClientPool,
    Sql.selectNotificationEmailByName(name)
  );
  await checkNotificationRemovePermissions(check, hasPermission)

  const nids = await Helpers(sqlClientPool).getAssignedNotificationIds({
    name,
    type: 'email'
  });

  if (R.length(nids) > 0) {
    throw new Error("Can't delete notification linked to projects");
  }

  await deleteNotificationGeneric(sqlClientPool, 'notification_email', 'email', name);

  // TODO: maybe check rows for changed result
  return 'success';
};

export const deleteNotificationRocketChat: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission }
) => {
  const { name } = input;
  const check = await query(
    sqlClientPool,
    Sql.selectNotificationRocketChatByName(name)
  );
  await checkNotificationRemovePermissions(check, hasPermission)

  const nids = await Helpers(sqlClientPool).getAssignedNotificationIds({
    name,
    type: 'rocketchat'
  });

  if (R.length(nids) > 0) {
    throw new Error("Can't delete notification linked to projects");
  }

  await deleteNotificationGeneric(sqlClientPool, "notification_rocketchat", "rocketchat", name);

  // TODO: maybe check rows for changed result
  return 'success';
};

export const deleteNotificationSlack: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission }
) => {
  const { name } = input;
  const check = await query(
    sqlClientPool,
    Sql.selectNotificationSlackByName(name)
  );
  await checkNotificationRemovePermissions(check, hasPermission)

  const nids = await Helpers(sqlClientPool).getAssignedNotificationIds({
    name,
    type: 'slack'
  });

  if (R.length(nids) > 0) {
    throw new Error("Can't delete notification linked to projects");
  }

  await deleteNotificationGeneric(sqlClientPool, "notification_slack", "slack", name);

  // TODO: maybe check rows for changed result
  return 'success';
};


export const deleteNotificationWebhook: ResolverFn = async (
  root,
  { input },
  {
    sqlClientPool,
    hasPermission,
  },
) => {
  const { name } = input;
  const check = await query(
    sqlClientPool,
    Sql.selectNotificationWebhookByName(name)
  );
  await checkNotificationRemovePermissions(check, hasPermission)

  const nids = await Helpers(sqlClientPool).getAssignedNotificationIds({
    name,
    type: 'webhook',
  });

  if (R.length(nids) > 0) {
    throw new Error("Can't delete notification linked to projects");
  }

  await deleteNotificationGeneric(sqlClientPool, "notification_webhook", "webhook", name);

  // TODO: maybe check rows for changed result
  return 'success';
};



export const removeNotificationFromProject: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission }
) => {
  const select = await query(
    sqlClientPool,
    projectSql.selectProjectByName(input.project)
  );
  const project = R.path([0], select) as any;


  // if a project is configured with organizations
  // only organization permissions should be able to remove notifications
  if (project.organization != null) {
    await hasPermission('organization', 'removeNotification', {
      organization: project.organization
    });
  } else {
    await hasPermission('project', 'addNotification', {
      project: project.id
    });
  }

  await query(sqlClientPool, Sql.deleteProjectNotification(input));

  return project;
};

const NOTIFICATION_TYPES = ['slack', 'rocketchat', 'microsoftteams', 'email', 'webhook'];

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
  const types = argsType == null ? NOTIFICATION_TYPES : [argsType.toLowerCase()];

  const results = await Promise.all(
    types.map(type =>
      query(
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

export const getNotificationsByOrganizationId: ResolverFn = async (
  { id: oid },
  unformattedArgs,
  { sqlClientPool, hasPermission }
) => {

  await hasPermission('organization', 'viewNotification', {
    organization: oid
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
  const types = argsType == null ? NOTIFICATION_TYPES : [argsType.toLowerCase()];

  const results = await Promise.all(
    types.map(type =>
      organizationHelpers(sqlClientPool).getNotificationsByTypeForOrganizationId(oid, type)
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

const checkNotificationUpdatePermissions = async (check, hasPermission) => {
  if (R.prop(0, check).organization != null) {
    await hasPermission('organization', 'updateNotification', {
      organization: R.prop(0, check).organization
    });
  } else {
    await hasPermission('notification', 'update');
  }
}

const checkNotificationExists = (name, check) => {
  if (R.find(R.propEq('name', `${name}`))(check) == undefined) {
    throw new Error(`No notification found for ${name}`);
  }
}

export const updateNotificationMicrosoftTeams: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission }
) => {
  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }
  const { name, patch: {name: newName = ''} } = input;
  const check = await query(
    sqlClientPool,
    Sql.selectNotificationMicrosoftTeamsByName(name)
  );

  checkNotificationExists(name, check);

  await checkNotificationUpdatePermissions(check, hasPermission)

  try {
    await query(sqlClientPool, Sql.updateNotificationMicrosoftTeams(input));
  } catch(error) {
    if(error.text.includes("Duplicate entry")){
      throw new Error(
        `Error renaming notification ${input.name}. Notification ${input.patch.name} already exists`
      )
    } else {
      throw new Error(error.message);
    }
  };

  const rows = await query(
    sqlClientPool,
    Sql.selectNotificationMicrosoftTeamsByName(newName ? newName : name)
  );

  return R.prop(0, rows);
};

export const updateNotificationWebhook: ResolverFn = async (
  root,
  { input },
  {
    sqlClientPool,
    hasPermission,
  },
) => {
  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }
  const { name, patch: {name: newName = ''} } = input;
  const check = await query(
    sqlClientPool,
    Sql.selectNotificationWebhookByName(name)
  );

  checkNotificationExists(name, check);

  await checkNotificationUpdatePermissions(check, hasPermission)

  try {
    await query(sqlClientPool, Sql.updateNotificationWebhook(input));
  } catch(error) {
    if(error.text.includes("Duplicate entry")){
      throw new Error(
        `Error renaming notification ${input.name}. Notification ${input.patch.name} already exists`
      )
    } else {
      throw new Error(error.message);
    }
  };

  const rows = await query(
    sqlClientPool,
    Sql.selectNotificationWebhookByName(newName ? newName : name),
  );

  return R.prop(0, rows);
};

export const updateNotificationEmail: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission }
) => {
  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }
  const { name, patch: {name: newName = ''} } = input;
  const check = await query(
    sqlClientPool,
    Sql.selectNotificationEmailByName(name)
  );

  checkNotificationExists(name, check)

  await checkNotificationUpdatePermissions(check, hasPermission)

  try {
    await query(sqlClientPool, Sql.updateNotificationEmail(input));
  } catch(error) {
    if(error.text.includes("Duplicate entry")){
      throw new Error(
        `Error renaming notification ${input.name}. Notification ${input.patch.name} already exists`
      )
    } else {
      throw new Error(error.message);
    }
  };

  const rows = await query(
    sqlClientPool,
    Sql.selectNotificationEmailByName(newName ? newName : name)
  );

  return R.prop(0, rows);
};

export const updateNotificationRocketChat: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission }
) => {
  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }
  const { name, patch: {name: newName = ''} } = input;
  const check = await query(
    sqlClientPool,
    Sql.selectNotificationRocketChatByName(name)
  );

  checkNotificationExists(name, check)

  await checkNotificationUpdatePermissions(check, hasPermission)

  try {
    await query(sqlClientPool, Sql.updateNotificationRocketChat(input));
  } catch(error) {
    if(error.text.includes("Duplicate entry")){
      throw new Error(
        `Error renaming notification ${input.name}. Notification ${input.patch.name} already exists`
      )
    } else {
      throw new Error(error.message);
    }
  };

  const rows = await query(
    sqlClientPool,
    Sql.selectNotificationRocketChatByName(newName ? newName : name)
  );

  return R.prop(0, rows);
};

export const updateNotificationSlack: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission }
) => {
  if (isPatchEmpty(input)) {
    throw new Error('input.patch requires at least 1 attribute');
  }
  const { name, patch: {name: newName = ''} } = input;
  const check = await query(
    sqlClientPool,
    Sql.selectNotificationSlackByName(name)
  );

  checkNotificationExists(name, check)

  await checkNotificationUpdatePermissions(check, hasPermission)

  try {
    await query(sqlClientPool, Sql.updateNotificationSlack(input));
  } catch(error) {
    if(error.text.includes("Duplicate entry")){
      throw new Error(
        `Error renaming notification ${input.name}. Notification ${input.patch.name} already exists`
      )
    } else {
      throw new Error(error.message);
    }
  };

  const rows = await query(
    sqlClientPool,
    Sql.selectNotificationSlackByName(newName ? newName : name)
  );

  return R.prop(0, rows);
};

export const getAllNotifications: ResolverFn = async (
  root,
  args,
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('notification', 'viewAll');

  const rows = await Helpers(sqlClientPool).selectAllNotifications();

  return rows;
};