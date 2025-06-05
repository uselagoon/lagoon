const GraphQLDate = require('graphql-iso-date');
const GraphQLJSON = require('graphql-type-json');

const {
  getAllProblems,
  getProblemsByEnvironmentId,
  addProblem,
  deleteProblem,
  deleteProblemsFromSource,
  addProblemsFromSource,
  getProblemSources,
} = require('./resources/problem/resolvers');

const {
  getFactsByEnvironmentId,
  addFact,
  addFacts,
  addFactsByName,
  deleteFact,
  deleteFactsFromSource,
  addFactReference,
  deleteFactReference,
  deleteAllFactReferencesByFactId,
  getFactReferencesByFactId,
  getProjectsByFactSearch,
  getEnvironmentsByFactSearch,
} = require('./resources/fact/resolvers');

const {
  getAuditLogs,
} = require('./resources/audit/resolvers');

const { SeverityScoreType } = require('./resources/problem/types');

const { getLagoonVersion } = require('./resources/lagoon/resolvers');

const {
  getInsightsFileData,
  getInsightsFilesByEnvironmentId,
  getInsightsDownloadUrl,
} = require('./resources/insight/resolvers');

const {
  getDeploymentsByEnvironmentId,
  getDeploymentByRemoteId,
  getDeploymentByName,
  getDeploymentsByBulkId,
  getDeploymentsByFilter,
  addDeployment,
  deleteDeployment,
  updateDeployment,
  cancelDeployment,
  bulkDeployEnvironmentLatest,
  deployEnvironmentLatest,
  deployEnvironmentBranch,
  deployEnvironmentPullrequest,
  deployEnvironmentPromote,
  switchActiveStandby,
  deploymentSubscriber,
  getDeploymentUrl,
  getBuildLog,
} = require('./resources/deployment/resolvers');

const {
  getTasksByEnvironmentId,
  getTaskByTaskName,
  getTaskByRemoteId,
  getTaskById,
  addTask,
  deleteTask,
  updateTask,
  cancelTask,
  taskDrushArchiveDump,
  taskDrushSqlDump,
  taskDrushCacheClear,
  taskDrushCron,
  taskDrushSqlSync,
  taskDrushRsyncFiles,
  taskDrushUserLogin,
  taskSubscriber,
  getTaskLog,
} = require('./resources/task/resolvers');

const {
  addAdvancedTaskDefinition,
  updateAdvancedTaskDefinition,
  advancedTaskDefinitionById,
  resolveTasksForEnvironment,
  getRegisteredTasksByEnvironmentId,
  advancedTaskDefinitionArgumentById,
  invokeRegisteredTask,
  deleteAdvancedTaskDefinition,
  allAdvancedTaskDefinitions,
} = require('./resources/task/task_definition_resolvers');

const {
  getFilesByTaskId,
  uploadFilesForTask,
  deleteFilesForTask,
  getDownloadLink,
} = require('./resources/file/resolvers');

const {
  addOrUpdateEnvironment,
  addOrUpdateEnvironmentStorage,
  getEnvironmentByName,
  getEnvironmentById,
  getEnvironmentByOpenshiftProjectName,
  getEnvironmentByKubernetesNamespaceName,
  getEnvironmentHoursMonthByEnvironmentId,
  getEnvironmentStorageByEnvironmentId,
  getEnvironmentStorageMonthByEnvironmentId,
  getEnvironmentHitsMonthByEnvironmentId,
  getEnvironmentByDeploymentId,
  getEnvironmentByTaskId,
  getEnvironmentByBackupId,
  getEnvironmentServicesByEnvironmentId,
  setEnvironmentServices,
  deleteEnvironment,
  getEnvironmentsByProjectId,
  updateEnvironment,
  getAllEnvironments,
  userCanSshToEnvironment,
  getEnvironmentUrl,
  getEnvironmentsByKubernetes,
  addOrUpdateEnvironmentService,
  getEnvironmentByServiceId,
  getServiceContainersByServiceId,
  deleteEnvironmentService,
} = require('./resources/environment/resolvers');

const {
  getDeployTargetConfigById,
  getDeployTargetConfigsByProjectId,
  getDeployTargetConfigsByDeployTarget,
  addDeployTargetConfig,
  deleteDeployTargetConfig,
  updateDeployTargetConfig,
  updateEnvironmentDeployTarget,
} = require('./resources/deploytargetconfig/resolvers');

const {
  addNotificationMicrosoftTeams,
  addNotificationRocketChat,
  addNotificationSlack,
  addNotificationWebhook,
  addNotificationToProject,
  deleteNotificationMicrosoftTeams,
  deleteNotificationRocketChat,
  deleteNotificationSlack,
  deleteNotificationWebhook,
  getAllNotifications,
  getNotificationsByProjectId,
  getNotificationsByOrganizationId,
  removeNotificationFromProject,
  updateNotificationMicrosoftTeams,
  updateNotificationRocketChat,
  updateNotificationSlack,
  updateNotificationWebhook,
  addNotificationEmail,
  updateNotificationEmail,
  deleteNotificationEmail,
} = require('./resources/notification/resolvers');

const {
  addOpenshift,
  deleteOpenshift,
  getAllOpenshifts,
  getOpenshiftByProjectId,
  getOpenshiftByDeployTargetId,
  getOpenshiftByEnvironmentId,
  getProjectUser,
  updateOpenshift,
  getToken,
  getConsoleUrl,
  getMonitoringConfig,
} = require('./resources/openshift/resolvers');

const {
  deleteProject,
  addProject,
  getProjectByName,
  getProjectById,
  getProjectByGitUrl,
  getProjectByEnvironmentId,
  getProjectsByMetadata,
  getAllProjects,
  updateProject,
  getProjectUrl,
  updateProjectMetadata,
  removeProjectMetadataByKey,
  getPrivateKey,
  getProjectDeployKey,
} = require('./resources/project/resolvers');

const {
  getUserSshKeys,
  addSshKey,
  updateSshKey,
  deleteSshKey,
  deleteSshKeyById,
} = require('./resources/sshKey/resolvers');

const {
  getMe,
  getUserBySshKey,
  getUserBySshFingerprint,
  addUser,
  updateUser,
  addUserToOrganization,
  removeUserFromOrganization,
  addAdminToOrganization,
  removeAdminFromOrganization,
  resetUserPassword,
  deleteUser,
  getAllUsers,
  getUserByEmail,
  getAllPlatformUsers,
  addPlatformRoleToUser,
  removePlatformRoleFromUser,
} = require('./resources/user/resolvers');

const {
  getAllGroups,
  getGroupsByProjectId,
  getGroupsByUserId,
  getGroupByName,
  addGroup,
  getAllProjectsInGroup,
  getAllProjectsByGroupId,
  updateGroup,
  deleteGroup,
  addUserToGroup,
  removeUserFromGroup,
  addGroupsToProject,
  removeGroupsFromProject,
  getMembersByGroupId,
  getMemberCountByGroupId,
  getGroupRolesByUserId,
} = require('./resources/group/resolvers');

const {
  addOrganization,
  getAllOrganizations,
  updateOrganization,
  deleteOrganization,
  getOrganizationById,
  getOrganizationByName,
  addDeployTargetToOrganization,
  removeDeployTargetFromOrganization,
  getDeployTargetsByOrganizationId,
  getGroupsByOrganizationId,
  getUsersByOrganizationId,
  getUserByEmailAndOrganizationId,
  getGroupRolesByUserIdAndOrganization,
  getGroupsByNameAndOrganizationId,
  getOwnersByOrganizationId,
  getProjectsByOrganizationId,
  addExistingProjectToOrganization,
  removeProjectFromOrganization,
  addExistingGroupToOrganization,
  getGroupsByOrganizationsProject,
  getGroupCountByOrganizationProject,
  getProjectGroupOrganizationAssociation, // WIP resolver
  getGroupProjectOrganizationAssociation, // WIP resolver
  getNotificationsForOrganizationProjectId,
  getEnvironmentsByOrganizationId,
  removeUserFromOrganizationGroups,
  checkBulkImportProjectsAndGroupsToOrganization,
  bulkImportProjectsAndGroupsToOrganization
} = require('./resources/organization/resolvers');

const {
  addBackup,
  getBackupsByEnvironmentId,
  deleteBackup,
  addRestore,
  getRestoreByBackupId,
  updateRestore,
  backupSubscriber,
  getRestoreLocation,
} = require('./resources/backup/resolvers');

const {
  getEnvVarsByOrganizationId,
  getEnvVarsByProjectId,
  getEnvVarsByEnvironmentId,
  addEnvVariable,
  deleteEnvVariable,
  addOrUpdateEnvVariableByName,
  deleteEnvVariableByName,
  getEnvVariablesByProjectEnvironmentName,
} = require('./resources/env-variables/resolvers');

async function getResolvers() {
  let graphqlUpload;
  try {
    const { default: GraphQLUpload } = await import("graphql-upload/GraphQLUpload.mjs");
    graphqlUpload = {
      ...GraphQLUpload,
      parseLiteral: (ast) => {
        return null; // Allow literals but treats them as null - issue with graphql-upload & apollo-server3
      }
    };

    if (!graphqlUpload) {
      throw new Error("Failed to load GraphQLUpload from 'graphql-upload'");
    }
  } catch (error) {
    console.error("Failed to load GraphQLUpload:", error);
    throw error;
  }

  const resolvers = {
    Upload: graphqlUpload,
    AuditType: {
      BACKUP: 'backup',
      BULKDEPLOYMENT: 'bulkdeployment',
      DEPLOYMENT: 'deployment',
      DEPLOYTARGET: 'deploytarget',
      DEPLOYTARGETCONFIG: 'deploytargetconfig',
      ENVIRONMENT: 'environment',
      GROUP: 'group',
      NOTIFICATION: 'notification',
      ORGANIZATION: 'organization',
      PROJECT: 'project',
      SSHKEY: 'sshkey',
      TASK: 'task',
      USER: 'user',
      VARIABLE: 'variable',
    },
    AuditSource: {
      API: 'api',
      CLI: 'cli',
      UI: 'ui',
    },
    GroupRole: {
      GUEST: 'guest',
      REPORTER: 'reporter',
      DEVELOPER: 'developer',
      MAINTAINER: 'maintainer',
      OWNER: 'owner'
    },
    DeploymentSourceType: {
      API: 'api',
      WEBHOOK: 'webhook'
    },
    TaskSourceType: {
      API: 'api',
    },
    ProjectOrderType: {
      NAME: 'name',
      CREATED: 'created'
    },
    EnvOrderType: {
      NAME: 'name',
      UPDATED: 'updated'
    },
    DeployType: {
      BRANCH: 'branch',
      PULLREQUEST: 'pullrequest',
      PROMOTE: 'promote'
    },
    EnvType: {
      PRODUCTION: 'production',
      DEVELOPMENT: 'development'
    },
    EnvVariableType: {
      PROJECT: 'project',
      ENVIRONMENT: 'environment'
    },
    EnvVariableScope: {
      BUILD: 'build',
      RUNTIME: 'runtime',
      GLOBAL: 'global',
      CONTAINER_REGISTRY: 'container_registry',
      INTERNAL_CONTAINER_REGISTRY: 'internal_container_registry'
    },
    RestoreStatusType: {
      PENDING: 'pending',
      SUCCESSFUL: 'successful',
      FAILED: 'failed'
    },
    DeploymentStatusType: {
      NEW: 'new',
      PENDING: 'pending',
      RUNNING: 'running',
      CANCELLED: 'cancelled',
      ERROR: 'error',
      FAILED: 'failed',
      COMPLETE: 'complete',
      QUEUED: 'queued',
    },
    NotificationType: {
      SLACK: 'slack',
      ROCKETCHAT: 'rocketchat',
      MICROSOFTTEAMS: 'microsoftteams',
      EMAIL: 'email',
      WEBHOOK: 'webhook',
    },
    NotificationContentType: {
      DEPLOYMENT: 'deployment',
      PROBLEM: 'problem'
    },
    TaskStatusType: {
      NEW: 'new',
      PENDING: 'pending',
      RUNNING: 'running',
      CANCELLED: 'cancelled',
      ERROR: 'error',
      FAILED: 'failed',
      COMPLETE: 'complete',
      QUEUED: 'queued',
      ACTIVE: 'active',
      SUCCEEDED: 'succeeded',
    },
    PlatformRole: {
      VIEWER: 'platform-viewer',
      OWNER: 'platform-owner',
      ORGANIZATION_OWNER: 'platform-organization-owner',
    },
    Openshift: {
      projectUser: getProjectUser,
      token: getToken,
      consoleUrl: getConsoleUrl,
      monitoringConfig: getMonitoringConfig,
    },
    Kubernetes: {
      projectUser: getProjectUser,
      token: getToken,
      consoleUrl: getConsoleUrl,
      monitoringConfig: getMonitoringConfig,
    },
    Project: {
      notifications: getNotificationsByProjectId,
      openshift: getOpenshiftByProjectId,
      kubernetes: getOpenshiftByProjectId,
      environments: getEnvironmentsByProjectId,
      deployTargetConfigs: getDeployTargetConfigsByProjectId,
      envVariables: getEnvVarsByProjectId,
      groups: getGroupsByProjectId,
      privateKey: getPrivateKey,
      publicKey: getProjectDeployKey,
    },
    GroupInterface: {
      __resolveType(group) {
        return 'Group';
      },
    },
    OrgGroupInterface: {
      __resolveType(group) {
        return 'OrgGroup';
      },
    },
    Group: {
      projects: getAllProjectsByGroupId,
      members: getMembersByGroupId,
      memberCount: getMemberCountByGroupId,
    },
    OrgGroup: {
      projects: getAllProjectsByGroupId,
      members: getMembersByGroupId,
      memberCount: getMemberCountByGroupId,
    },
    DeployTargetConfig: {
      project: getProjectById,
      deployTarget: getOpenshiftByDeployTargetId,
    },
    Environment: {
      project: getProjectByEnvironmentId,
      deployments: getDeploymentsByEnvironmentId,
      insights: getInsightsFilesByEnvironmentId,
      tasks: getTasksByEnvironmentId,
      advancedTasks: getRegisteredTasksByEnvironmentId,
      hoursMonth: getEnvironmentHoursMonthByEnvironmentId,
      storages: getEnvironmentStorageByEnvironmentId,
      storageMonth: getEnvironmentStorageMonthByEnvironmentId,
      hitsMonth: getEnvironmentHitsMonthByEnvironmentId,
      backups: getBackupsByEnvironmentId,
      envVariables: getEnvVarsByEnvironmentId,
      services: getEnvironmentServicesByEnvironmentId,
      problems: getProblemsByEnvironmentId,
      facts: getFactsByEnvironmentId,
      openshift: getOpenshiftByEnvironmentId,
      kubernetes: getOpenshiftByEnvironmentId,
    },
    Organization: {
      groups: getGroupsByOrganizationId,
      projects: getProjectsByOrganizationId,
      environments: getEnvironmentsByOrganizationId,
      owners: getOwnersByOrganizationId,
      deployTargets: getDeployTargetsByOrganizationId,
      notifications: getNotificationsByOrganizationId,
      envVariables: getEnvVarsByOrganizationId,
    },
    OrgProject: {
      groups: getGroupsByOrganizationsProject,
      groupCount: getGroupCountByOrganizationProject,
      notifications: getNotificationsForOrganizationProjectId,
    },
    OrgEnvironment: {
      project: getProjectById,
      openshift: getOpenshiftByEnvironmentId,
      kubernetes: getOpenshiftByEnvironmentId,
    },
    Fact: {
      references: getFactReferencesByFactId,
    },
    EnvironmentService: {
      containers: getServiceContainersByServiceId,
    },
    Deployment: {
      environment: getEnvironmentByDeploymentId,
      uiLink: getDeploymentUrl,
      buildLog: getBuildLog,
    },
    Insight: {
      data: getInsightsFileData,
      downloadUrl: getInsightsDownloadUrl,
    },
    Task: {
      environment: getEnvironmentByTaskId,
      files: getFilesByTaskId,
      logs: getTaskLog
    },
    File: {
      download: getDownloadLink
    },
    Notification: {
      __resolveType(obj) {
        switch (obj.type) {
          case 'slack':
            return 'NotificationSlack';
          case 'rocketchat':
            return 'NotificationRocketChat';
          case 'microsoftteams':
            return 'NotificationMicrosoftTeams';
          case 'email':
            return 'NotificationEmail';
          case 'webhook':
            return 'NotificationWebhook';
          default:
            return null;
        }
      }
    },
    AdvancedTaskDefinition: {
      __resolveType (obj) {
        switch(obj.type) {
          case 'IMAGE':
            return 'AdvancedTaskDefinitionImage';
          case 'COMMAND':
            return 'AdvancedTaskDefinitionCommand';
          default:
            return null;
        }
      }
    },
    User: {
      sshKeys: getUserSshKeys,
      groups: getGroupsByUserId,
      groupRoles: getGroupRolesByUserId,
    },
    OrgUser: {
      groupRoles: getGroupRolesByUserIdAndOrganization,
    },
    Backup: {
      restore: getRestoreByBackupId,
      environment: getEnvironmentByBackupId
    },
    Query: {
      me: getMe,
      lagoonVersion: getLagoonVersion,
      userBySshKey: getUserBySshKey,
      userBySshFingerprint: getUserBySshFingerprint,
      projectByGitUrl: getProjectByGitUrl,
      projectByName: getProjectByName,
      orgProjectByName: getProjectByName,
      environmentsByKubernetes: getEnvironmentsByKubernetes,
      groupByName: getGroupByName,
      groupByNameAndOrganization: getGroupsByNameAndOrganizationId,
      usersByOrganization: getUsersByOrganizationId,
      userByEmailAndOrganization: getUserByEmailAndOrganizationId,
      problemSources: getProblemSources,
      environmentByName: getEnvironmentByName,
      environmentById: getEnvironmentById,
      environmentByOpenshiftProjectName: getEnvironmentByOpenshiftProjectName,
      environmentByKubernetesNamespaceName: getEnvironmentByKubernetesNamespaceName,
      environmentsByFactSearch: getEnvironmentsByFactSearch,
      userCanSshToEnvironment,
      deploymentByRemoteId: getDeploymentByRemoteId,
      deploymentByName: getDeploymentByName,
      deploymentsByBulkId: getDeploymentsByBulkId,
      deploymentsByFilter: getDeploymentsByFilter,
      taskByTaskName: getTaskByTaskName,
      taskByRemoteId: getTaskByRemoteId,
      taskById: getTaskById,
      advancedTaskDefinitionById,
      advancedTasksForEnvironment: resolveTasksForEnvironment,
      allAdvancedTaskDefinitions,
      advancedTaskDefinitionArgumentById,
      allProjects: getAllProjects,
      allOpenshifts: getAllOpenshifts,
      allKubernetes: getAllOpenshifts,
      allEnvironments: getAllEnvironments,
      allProblems: getAllProblems,
      allGroups: getAllGroups,
      allProjectsInGroup: getAllProjectsInGroup,
      allUsers: getAllUsers,
      allNotifications: getAllNotifications,
      userByEmail: getUserByEmail,
      projectsByMetadata: getProjectsByMetadata,
      projectsByFactSearch: getProjectsByFactSearch,
      deployTargetConfigById: getDeployTargetConfigById,
      deployTargetConfigsByProjectId: getDeployTargetConfigsByProjectId,
      deployTargetConfigsByDeployTarget: getDeployTargetConfigsByDeployTarget,
      allOrganizations: getAllOrganizations,
      organizationById: getOrganizationById,
      organizationByName: getOrganizationByName,
      getGroupProjectOrganizationAssociation,
      getProjectGroupOrganizationAssociation,
      getEnvVariablesByProjectEnvironmentName,
      checkBulkImportProjectsAndGroupsToOrganization,
      allPlatformUsers: getAllPlatformUsers,
      getAuditLogs,
    },
    Mutation: {
      addProblem,
      deleteProblem,
      deleteProblemsFromSource,
      addFact,
      addFacts,
      addFactsByName,
      deleteFact,
      deleteFactsFromSource,
      addFactReference,
      deleteFactReference,
      deleteAllFactReferencesByFactId,
      addOrUpdateEnvironment,
      updateEnvironment,
      deleteEnvironment,
      addOrUpdateEnvironmentStorage,
      addOrUpdateStorageOnEnvironment: addOrUpdateEnvironmentStorage,
      addNotificationSlack,
      updateNotificationSlack,
      deleteNotificationSlack,
      addNotificationWebhook,
      updateNotificationWebhook,
      deleteNotificationWebhook,
      addNotificationRocketChat,
      updateNotificationRocketChat,
      deleteNotificationRocketChat,
      addNotificationMicrosoftTeams,
      updateNotificationMicrosoftTeams,
      deleteNotificationMicrosoftTeams,
      addNotificationEmail,
      updateNotificationEmail,
      deleteNotificationEmail,
      addNotificationToProject,
      removeNotificationFromProject,
      addOpenshift,
      updateOpenshift,
      deleteOpenshift,
      addKubernetes: addOpenshift,
      updateKubernetes: updateOpenshift,
      deleteKubernetes: deleteOpenshift,
      addProject,
      updateProject,
      deleteProject,
      updateProjectMetadata,
      removeProjectMetadataByKey,
      addSshKey,
      updateSshKey,
      deleteSshKey,
      deleteSshKeyById,
      addUserSSHPublicKey: addSshKey,
      updateUserSSHPublicKey: updateSshKey,
      deleteUserSSHPublicKey: deleteSshKeyById,
      addUser,
      updateUser,
      addUserToOrganization,
      removeUserFromOrganization,
      addAdminToOrganization,
      removeAdminFromOrganization,
      resetUserPassword,
      deleteUser,
      addDeployment,
      deleteDeployment,
      updateDeployment,
      cancelDeployment,
      bulkDeployEnvironmentLatest,
      addBackup,
      deleteBackup,
      addRestore,
      updateRestore,
      addEnvVariable,
      deleteEnvVariable,
      addOrUpdateEnvVariableByName,
      deleteEnvVariableByName,
      addTask,
      addAdvancedTaskDefinition,
      updateAdvancedTaskDefinition,
      deleteAdvancedTaskDefinition,
      invokeRegisteredTask,
      taskDrushArchiveDump,
      taskDrushSqlDump,
      taskDrushCacheClear,
      taskDrushCron,
      taskDrushSqlSync,
      taskDrushRsyncFiles,
      taskDrushUserLogin,
      deleteTask,
      updateTask,
      cancelTask,
      setEnvironmentServices,
      uploadFilesForTask,
      deleteFilesForTask,
      deployEnvironmentLatest,
      deployEnvironmentBranch,
      deployEnvironmentPullrequest,
      deployEnvironmentPromote,
      switchActiveStandby,
      addGroup,
      updateGroup,
      deleteGroup,
      addUserToGroup,
      removeUserFromGroup,
      addGroupsToProject,
      removeGroupsFromProject,
      addDeployTargetConfig,
      deleteDeployTargetConfig,
      updateDeployTargetConfig,
      addOrganization,
      updateOrganization,
      deleteOrganization,
      addGroupToOrganization: addGroup,
      addExistingGroupToOrganization,
      addExistingProjectToOrganization,
      removeProjectFromOrganization,
      addDeployTargetToOrganization,
      removeDeployTargetFromOrganization,
      updateEnvironmentDeployTarget,
      removeUserFromOrganizationGroups,
      bulkImportProjectsAndGroupsToOrganization,
      addOrUpdateEnvironmentService,
      deleteEnvironmentService,
      addPlatformRoleToUser,
      removePlatformRoleFromUser,
    },
    Subscription: {
      backupChanged: backupSubscriber,
      deploymentChanged: deploymentSubscriber,
      taskChanged: taskSubscriber
    },
    Date: GraphQLDate,
    JSON: GraphQLJSON,
    SeverityScore: SeverityScoreType
  };

  return resolvers;
}
module.exports = getResolvers;
