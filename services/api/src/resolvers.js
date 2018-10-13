// @flow

const GraphQLDate = require('graphql-iso-date');

const {
  addCustomer,
  deleteCustomer,
  getAllCustomers,
  getCustomerByProjectId,
  updateCustomer,
  getCustomerByName,
  deleteAllCustomers,
} = require('./resources/customer/resolvers');

const {
  getDeploymentsByEnvironmentId,
  getDeploymentByRemoteId,
  addDeployment,
  deleteDeployment,
  updateDeployment,
} = require('./resources/deployment/resolvers');

const {
  addOrUpdateEnvironment,
  addOrUpdateEnvironmentStorage,
  getEnvironmentByName,
  getEnvironmentByOpenshiftProjectName,
  getEnvironmentHoursMonthByEnvironmentId,
  getEnvironmentStorageByEnvironmentId,
  getEnvironmentStorageMonthByEnvironmentId,
  getEnvironmentHitsMonthByEnvironmentId,
  getEnvironmentByDeploymentId,
  deleteEnvironment,
  getEnvironmentsByProjectId,
  updateEnvironment,
  getAllEnvironments,
  deleteAllEnvironments,
} = require('./resources/environment/resolvers');

const {
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
} = require('./resources/notification/resolvers');

const {
  addOpenshift,
  deleteOpenshift,
  getAllOpenshifts,
  getOpenshiftByProjectId,
  updateOpenshift,
  deleteAllOpenshifts,
} = require('./resources/openshift/resolvers');

const {
  deleteProject,
  addProject,
  getProjectByName,
  getProjectByGitUrl,
  getProjectByEnvironmentId,
  getAllProjects,
  updateProject,
  deleteAllProjects,
} = require('./resources/project/resolvers');

const {
  getUserSshKeys,
  addSshKey,
  updateSshKey,
  deleteSshKey,
  deleteAllSshKeys,
  removeAllSshKeysFromAllUsers,
} = require('./resources/sshKey/resolvers');

const {
  getUsersByProjectId,
  getUserBySshKey,
  addUser,
  updateUser,
  deleteUser,
  addUserToCustomer,
  removeUserFromCustomer,
  getUsersByCustomerId,
  addUserToProject,
  removeUserFromProject,
  deleteAllUsers,
  removeAllUsersFromAllCustomers,
  removeAllUsersFromAllProjects,
} = require('./resources/user/resolvers');

const {
  addBackup,
  getBackupsByEnvironmentId,
} = require('./resources/backup/resolvers');

/* ::

import type {ResolversObj} from './resources';

*/

const resolvers /* : { [string]: ResolversObj | typeof GraphQLDate } */ = {
  Project: {
    customer: getCustomerByProjectId,
    users: getUsersByProjectId,
    notifications: getNotificationsByProjectId,
    openshift: getOpenshiftByProjectId,
    environments: getEnvironmentsByProjectId,
  },
  Environment: {
    project: getProjectByEnvironmentId,
    deployments: getDeploymentsByEnvironmentId,
    hoursMonth: getEnvironmentHoursMonthByEnvironmentId,
    storages: getEnvironmentStorageByEnvironmentId,
    storageMonth: getEnvironmentStorageMonthByEnvironmentId,
    hitsMonth: getEnvironmentHitsMonthByEnvironmentId,
    backups: getBackupsByEnvironmentId,
  },
  Deployment: {
    environment: getEnvironmentByDeploymentId,
  },
  Notification: {
    __resolveType(obj) {
      // $FlowFixMe
      switch (obj.type) {
        case 'slack':
          return 'NotificationSlack';
        case 'rocketchat':
          return 'NotificationRocketChat';
        default:
          return null;
      }
    },
  },
  Customer: {
    users: getUsersByCustomerId,
  },
  User: {
    sshKeys: getUserSshKeys,
  },
  Query: {
    userBySshKey: getUserBySshKey,
    customerByName: getCustomerByName,
    projectByGitUrl: getProjectByGitUrl,
    projectByName: getProjectByName,
    environmentByName: getEnvironmentByName,
    environmentByOpenshiftProjectName: getEnvironmentByOpenshiftProjectName,
    deploymentByRemoteId: getDeploymentByRemoteId,
    allProjects: getAllProjects,
    allCustomers: getAllCustomers,
    allOpenshifts: getAllOpenshifts,
    allEnvironments: getAllEnvironments,
  },
  Mutation: {
    addCustomer,
    updateCustomer,
    deleteCustomer,
    deleteAllCustomers,
    addOrUpdateEnvironment,
    updateEnvironment,
    deleteEnvironment,
    deleteAllEnvironments,
    addOrUpdateEnvironmentStorage,
    addNotificationSlack,
    updateNotificationSlack,
    deleteNotificationSlack,
    deleteAllNotificationSlacks,
    addNotificationRocketChat,
    updateNotificationRocketChat,
    deleteNotificationRocketChat,
    deleteAllNotificationRocketChats,
    addNotificationToProject,
    removeNotificationFromProject,
    removeAllNotificationsFromAllProjects,
    addOpenshift,
    updateOpenshift,
    deleteOpenshift,
    deleteAllOpenshifts,
    addProject,
    updateProject,
    deleteProject,
    deleteAllProjects,
    addSshKey,
    updateSshKey,
    deleteSshKey,
    deleteAllSshKeys,
    removeAllSshKeysFromAllUsers,
    addUser,
    updateUser,
    deleteUser,
    deleteAllUsers,
    addUserToCustomer,
    removeUserFromCustomer,
    removeAllUsersFromAllCustomers,
    addUserToProject,
    removeUserFromProject,
    removeAllUsersFromAllProjects,
    addDeployment,
    deleteDeployment,
    updateDeployment,
    addBackup,
  },
  Date: GraphQLDate,
};

module.exports = resolvers;
