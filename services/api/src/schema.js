// @flow

const R = require('ramda');
const { makeExecutableSchema } = require('graphql-tools');
const GraphQLDate = require('graphql-iso-date');
const gql = require('./util/gql');

// TODO: Re-enable Prettier after the problem with escaping interpolation in
// embedded GraphQL in JS is fixed and new version released.
// Ref: https://github.com/prettier/prettier/issues/4974
// prettier-ignore
const typeDefs = gql`
  scalar Date

  enum SshKeyType {
    SSH_RSA
    SSH_ED25519
  }

  enum DeployType {
    BRANCH
    PULLREQUEST
    PROMOTE
  }

  enum EnvType {
    PRODUCTION
    DEVELOPMENT
  }

  enum NotificationType {
    SLACK
    ROCKETCHAT
  }

  enum DeploymentStatusType {
    NEW
    PENDING
    RUNNING
    CANCELLED
    ERROR
    FAILED
    COMPLETE
  }

  type SshKey {
    id: Int
    name: String
    keyValue: String
    keyType: String
    created: String
  }

  type User {
    id: Int
    email: String
    firstName: String
    lastName: String
    comment: String
    gitlabId: Int
    sshKeys: [SshKey]
  }

  """
  Lagoon Customer (used for grouping multiple Projects)
  """
  type Customer {
    """
    Internal ID of this customer
    """
    id: Int
    """
    Name of customer
    """
    name: String
    """
    Arbitrary String for some comment
    """
    comment: String
    """
    SSH Private Key of Customer
    Will be used to authenticate against the Git Repos of the Project that are assigned to this project
    Needs to be in single string separated by \`\n\`, example:
    \`\`\`
    -----BEGIN RSA PRIVATE KEY-----\nMIIJKQIBAAKCAgEA+o[...]P0yoL8BoQQG2jCvYfWh6vyglQdrDYx/o6/8ecTwXokKKh6fg1q\n-----END RSA PRIVATE KEY-----
    \`\`\`
    """
    privateKey: String
    users: [User]
    created: String
  }

  type Openshift {
    id: Int
    name: String
    consoleUrl: String
    token: String
    routerPattern: String
    projectUser: String
    sshHost: String
    sshPort: String
    created: String
  }

  type NotificationRocketChat {
    id: Int
    name: String
    webhook: String
    channel: String
  }

  type NotificationSlack {
    id: Int
    name: String
    webhook: String
    channel: String
  }

  type UnassignedNotification {
    id: Int
    name: String
    type: String
  }

  union Notification = NotificationRocketChat | NotificationSlack

  """
  Lagoon Project (like a git repository)
  """
  type Project {
    """
    ID of project
    """
    id: Int
    """
    Name of project
    """
    name: String
    """
    Reference to customer object
    """
    customer: Customer
    """
    Git URL, needs to be SSH Git URL in one of these two formats
    - git@192.168.99.1/project1.git
    - ssh://git@192.168.99.1:2222/project1.git
    """
    gitUrl: String
    """
    Set if the .lagoon.yml should be found in a subfolder
    Usefull if you have multiple Lagoon projects per Git Repository
    """
    subfolder: String
    """
    Notifications that should be sent for this project
    """
    notifications(type: NotificationType): [Notification]
    """
    Which internal Lagoon System is responsible for deploying
    Currently only 'lagoon_openshiftBuildDeploy' exists
    """
    activeSystemsDeploy: String
    """
    Which internal Lagoon System is responsible for promoting
    Currently only 'lagoon_openshiftBuildDeploy' exists
    """
    activeSystemsPromote: String
    """
    Which internal Lagoon System is responsible for promoting
    Currently only 'lagoon_openshiftRemove' exists
    """
    activeSystemsRemove: String
    """
    Which branches should be deployed, can be one of:
    - \`true\` - all branches are deployed
    - \`false\` - no branches are deployed
    - REGEX - regex of all branches that should be deployed, example: \`^(master|staging)$\`
    """
    branches: String
    """
    Which Pull Requests should be deployed, can be one of:
    - \`true\` - all pull requests are deployed
    - \`false\` - no pull requests are deployed
    - REGEX - regex of all Pull Request titles that should be deployed, example: \`[BUILD]\`
    """
    pullrequests: String
    """
    Which environment(the name) should be marked as the production environment.
    *Important:* If you change this, you need to deploy both environments (the current and previous one) that are affected in order for the change to propagate correctly
    """
    productionEnvironment: String
    """
    Should this project have auto idling enabled (\`1\` or \`0\`)
    """
    autoIdle: Int
    """
    Should storage for this environment be calculated (\`1\` or \`0\`)
    """
    storageCalc: Int
    """
    Reference to OpenShift Object this Project should be deployed to
    """
    openshift: Openshift
    """
    Pattern of OpenShift Project/Namespace that should be generated, default: \`$\{project}-$\{environmentname}\`
    """
    openshiftProjectPattern: String
    """
    Which Developer SSH keys should have access to this project
    """
    users: [User]
    """
    How many environments can be deployed at one timeout
    """
    developmentEnvironmentsLimit: Int
    """
    Deployed Environments for this Project
    """
    environments(
      """
      Filter by Environment Type
      """
      type: EnvType
      """
      Include deleted Environments (by default deleted environment are hidden)
      """
      includeDeleted: Boolean
    ): [Environment]
    """
    Creation Timestamp of Project
    """
    created: String
  }

  """
  Lagoon Environment (for each branch, pullrequest there is an individual environment)
  """
  type Environment {
    """
    Internal ID of this Environment
    """
    id: Int
    """
    Name of this Environment
    """
    name: String
    """
    Reference to the Project Object
    """
    project: Project
    """
    Which Deployment Type this environment is, can be \`branch\`, \`pullrequest\`, \`promote\`
    """
    deployType: String
    """
    Which Environment Type this environment is, can be \`production\`, \`development\`
    """
    environmentType: String
    """
    Name of the OpenShift Project/Namespace this environemnt is deployed into
    """
    openshiftProjectName: String
    """
    Unix Timestamp of the last time this environment has been updated
    """
    updated: String
    """
    Unix Timestamp if the creation time
    """
    created: String
    """
    Unix Timestamp of when this project has been deleted
    """
    deleted: String
    """
    Reference to EnvironmentHoursMonth API Object, which returns how many hours this environment ran in a specific month
    """
    hoursMonth(month: Date): EnvironmentHoursMonth
    """
    Reference to EnvironmentStorage API Object, which shows the Storage consumption of this environment per day
    """
    storages: [EnvironmentStorage]
    """
    Reference to EnvironmentStorageMonth API Object, which returns how many storage per day this environment used in a specific month
    """
    storageMonth(month: Date): EnvironmentStorageMonth
    """
    Reference to EnviornmentHitsMonth API Object, which returns how many hits this environment generated in a specific month
    """
    hitsMonth(month: Date): EnviornmentHitsMonth
    route: String
    routes: String
    monitoringUrls: String
    deployments: [Deployment]
  }

  type EnviornmentHitsMonth {
    total: Int
  }

  type EnvironmentStorage {
    id: Int
    environment: Environment
    persistentStorageClaim: String
    bytesUsed: Float
    updated: String
  }

  type EnvironmentStorageMonth {
    month: String
    bytesUsed: Float
  }

  type EnvironmentHoursMonth {
    month: String
    hours: Int
  }

  type Deployment {
    id: Int
    name: String
    status: String
    created: String
    started: String
    completed: String
    environment: Environment
    remoteId: String
    buildLog: String
  }

  input DeleteEnvironmentInput {
    name: String!
    project: Int!
  }

  type Query {
    """
    Returns User Object by a given sshKey
    """
    userBySshKey(sshKey: String!): User
    """
    Returns Customer Object by a given name
    """
    customerByName(name: String!): Customer
    """
    Returns Project Object by a given name
    """
    projectByName(name: String!): Project
    """
    Returns Project Object by a given gitUrl (only the first one if there are multiple)
    """
    projectByGitUrl(gitUrl: String!): Project
    environmentByName(name: String!, project: Int!): Environment
    """
    Returns Environment Object by a given openshiftProjectName
    """
    environmentByOpenshiftProjectName(
      openshiftProjectName: String!
    ): Environment
    deploymentByRemoteId(id: String): Deployment
    """
    Returns all Project Objects matching given filters (all if no filter defined)
    """
    allProjects(createdAfter: String, gitUrl: String): [Project]
    """
    Returns all Customer Objects matching given filter (all if no filter defined)
    """
    allCustomers(createdAfter: String): [Customer]
    """
    Returns all OpenShift Objects
    """
    allOpenshifts: [Openshift]
    """
    Returns all Environments matching given filter (all if no filter defined)
    """
    allEnvironments(createdAfter: String, type: EnvType): [Environment]
  }

  input AddSshKeyInput {
    id: Int!
    name: String!
    keyValue: String!
    keyType: SshKeyType!
    userId: Int!
  }

  input DeleteSshKeyInput {
    name: String!
  }

  input AddProjectInput {
    id: Int
    name: String!
    customer: Int!
    gitUrl: String!
    subfolder: String
    openshift: Int!
    openshiftProjectPattern: String
    activeSystemsDeploy: String
    activeSystemsPromote: String
    activeSystemsRemove: String
    branches: String
    pullrequests: String
    productionEnvironment: String
    autoIdle: Int
    storageCalc: Int
    developmentEnvironmentsLimit: Int

  }

  input AddEnvironmentInput {
    name: String!
    project: Int!
    deployType: DeployType!
    environmentType: EnvType!
    openshiftProjectName: String!
  }

  input AddOrUpdateEnvironmentStorageInput {
    environment: Int!
    persistentStorageClaim: String!
    bytesUsed: Int!
  }

  input AddCustomerInput {
    id: Int
    name: String!
    comment: String
    privateKey: String
  }

  input DeploymentInput {
    id: Int
    name: String!
    status: DeploymentStatusType!
    created: String!
    started: String
    completed: String
    environment: Int!
    remoteId: String
  }

  input DeleteDeploymentInput {
    id: Int!
  }

  input UpdateDeploymentPatchInput {
    name: String
    status: DeploymentStatusType
    created: String
    started: String
    completed: String
    environment: Int
    remoteId: String
  }

  input UpdateDeploymentInput {
    id: Int!
    patch: UpdateDeploymentPatchInput!
  }

  input AddOpenshiftInput {
    id: Int
    name: String!
    consoleUrl: String!
    token: String
    routerPattern: String
    projectUser: String
    sshHost: String
    sshPort: String
  }

  input DeleteOpenshiftInput {
    name: String!
  }

  input DeleteCustomerInput {
    name: String!
  }

  input AddNotificationRocketChatInput {
    name: String!
    webhook: String!
    channel: String!
  }

  input AddNotificationSlackInput {
    name: String!
    webhook: String!
    channel: String!
  }

  input DeleteNotificationRocketChatInput {
    name: String!
  }

  input DeleteNotificationSlackInput {
    name: String!
  }

  input AddNotificationToProjectInput {
    project: String!
    notificationType: NotificationType!
    notificationName: String!
  }

  input RemoveNotificationFromProjectInput {
    project: String!
    notificationType: NotificationType!
    notificationName: String!
  }

  input AddUserInput {
    id: Int
    email: String!
    firstName: String
    lastName: String
    comment: String
    gitlabId: Int
  }

  input UpdateUserPatchInput {
    email: String
    firstName: String
    lastName: String
    comment: String
    gitlabId: Int
  }

  input UpdateUserInput {
    id: Int!
    patch: UpdateUserPatchInput!
  }

  input DeleteUserInput {
    id: Int!
  }

  input AddUserToProjectInput {
    project: String!
    userId: Int!
  }

  input RemoveUserFromProjectInput {
    project: String!
    userId: Int!
  }

  input AddUserToCustomerInput {
    customer: String!
    userId: Int!
  }

  input RemoveUserFromCustomerInput {
    customer: String!
    userId: Int!
  }

  input DeleteProjectInput {
    project: String!
  }

  input UpdateProjectPatchInput {
    name: String
    customer: Int
    gitUrl: String
    subfolder: String
    activeSystemsDeploy: String
    activeSystemsRemove: String
    branches: String
    productionEnvironment: String
    autoIdle: Int
    storageCalc: Int
    pullrequests: String
    openshift: Int
    openshiftProjectPattern: String
    developmentEnvironmentsLimit: Int
  }

  input UpdateProjectInput {
    id: Int!
    patch: UpdateProjectPatchInput!
  }

  input UpdateCustomerPatchInput {
    name: String
    comment: String
    privateKey: String
    created: String
  }

  input UpdateCustomerInput {
    id: Int!
    patch: UpdateCustomerPatchInput!
  }

  input UpdateOpenshiftPatchInput {
    name: String
    consoleUrl: String
    token: String
    routerPattern: String
    projectUser: String
    sshHost: String
    sshPort: String
  }

  input UpdateOpenshiftInput {
    id: Int!
    patch: UpdateOpenshiftPatchInput!
  }

  input UpdateNotificationRocketChatPatchInput {
    name: String
    webhook: String
    channel: String
  }

  input UpdateNotificationSlackPatchInput {
    name: String
    webhook: String
    channel: String
  }

  input UpdateNotificationRocketChatInput {
    name: String!
    patch: UpdateNotificationRocketChatPatchInput
  }

  input UpdateNotificationSlackInput {
    name: String!
    patch: UpdateNotificationSlackPatchInput
  }

  input UpdateSshKeyPatchInput {
    name: String
    keyValue: String
    keyType: SshKeyType
  }

  input UpdateSshKeyInput {
    id: Int!
    patch: UpdateSshKeyPatchInput!
  }

  input UpdateEnvironmentPatchInput {
    project: Int
    deployType: DeployType
    environmentType: EnvType
    openshiftProjectName: String
    route: String
    routes: String
    monitoringUrls: String
  }

  input UpdateEnvironmentInput {
    id: Int!
    patch: UpdateEnvironmentPatchInput
  }

  type Mutation {
    addCustomer(input: AddCustomerInput!): Customer
    updateCustomer(input: UpdateCustomerInput!): Customer
    deleteCustomer(input: DeleteCustomerInput!): String
    deleteAllCustomers: String
    """
    Add Environment or update if it is already existing
    """
    addOrUpdateEnvironment(input: AddEnvironmentInput!): Environment
    updateEnvironment(input: UpdateEnvironmentInput!): Environment
    deleteEnvironment(input: DeleteEnvironmentInput!): String
    deleteAllEnvironments: String
    """
    Add or update Storage Information for Environment
    """
    addOrUpdateEnvironmentStorage(
      input: AddOrUpdateEnvironmentStorageInput!
    ): EnvironmentStorage
    addNotificationSlack(input: AddNotificationSlackInput!): NotificationSlack
    updateNotificationSlack(
      input: UpdateNotificationSlackInput!
    ): NotificationSlack
    deleteNotificationSlack(input: DeleteNotificationSlackInput!): String
    deleteAllNotificationSlacks: String
    addNotificationRocketChat(
      input: AddNotificationRocketChatInput!
    ): NotificationRocketChat
    updateNotificationRocketChat(
      input: UpdateNotificationRocketChatInput!
    ): NotificationRocketChat
    deleteNotificationRocketChat(
      input: DeleteNotificationRocketChatInput!
    ): String
    deleteAllNotificationRocketChats: String
    """
    Connect previous created Notification to a Project
    """
    addNotificationToProject(input: AddNotificationToProjectInput!): Project
    removeNotificationFromProject(
      input: RemoveNotificationFromProjectInput!
    ): Project
    removeAllNotificationsFromAllProjects: String
    addOpenshift(input: AddOpenshiftInput!): Openshift
    updateOpenshift(input: UpdateOpenshiftInput!): Openshift
    deleteOpenshift(input: DeleteOpenshiftInput!): String
    deleteAllOpenshifts: String
    addProject(input: AddProjectInput!): Project
    updateProject(input: UpdateProjectInput!): Project
    deleteProject(input: DeleteProjectInput!): String
    deleteAllProjects: String
    addSshKey(input: AddSshKeyInput!): SshKey
    updateSshKey(input: UpdateSshKeyInput!): SshKey
    deleteSshKey(input: DeleteSshKeyInput!): String
    deleteAllSshKeys: String
    removeAllSshKeysFromAllUsers: String
    addUser(input: AddUserInput!): User
    updateUser(input: UpdateUserInput!): User
    deleteUser(input: DeleteUserInput!): String
    deleteAllUsers: String
    addUserToCustomer(input: AddUserToCustomerInput!): Customer
    removeUserFromCustomer(input: RemoveUserFromCustomerInput!): Customer
    removeAllUsersFromAllCustomers: String
    addUserToProject(input: AddUserToProjectInput!): Project
    removeUserFromProject(input: RemoveUserFromProjectInput!): Project
    removeAllUsersFromAllProjects: String
    addDeployment(input: DeploymentInput!): Deployment
    deleteDeployment(input: DeleteDeploymentInput!): String
    updateDeployment(input: UpdateDeploymentInput): Deployment
  }
`;

// Useful for transforming Enums on input.patch objects
// If an operation on input.patch[key] returns undefined,
// then the input.patch[key] will be ommitted for the result
const omitPatchKeyIfUndefined = key =>
  R.ifElse(
    R.compose(
      notUndefined,
      R.path(['patch', key]),
    ),
    R.identity,
    R.over(R.lensPath(['patch']), R.omit([key])),
  );

const notUndefined = R.compose(
  R.not,
  R.equals(undefined),
);

const sshKeyTypeToString = R.cond([
  [R.equals('SSH_RSA'), R.always('ssh-rsa')],
  [R.equals('SSH_ED25519'), R.always('ssh-ed25519')],
  [R.T, R.identity],
]);

const deployTypeToString = R.cond([
  [R.equals('BRANCH'), R.toLower],
  [R.equals('PULLREQUEST'), R.toLower],
  [R.equals('PROMOTE'), R.toLower],
  [R.T, R.identity],
]);

const envTypeToString = R.cond([
  [R.equals('PRODUCTION'), R.toLower],
  [R.equals('DEVELOPMENT'), R.toLower],
  [R.T, R.identity],
]);

const notificationTypeToString = R.cond([
  [R.equals('ROCKETCHAT'), R.toLower],
  [R.equals('SLACK'), R.toLower],
  [R.T, R.identity],
]);

const getDao = req => req.app.get('context').dao;
const deploymentStatusTypeToString = R.cond([
  [R.equals('NEW'), R.toLower],
  [R.equals('PENDING'), R.toLower],
  [R.equals('RUNNING'), R.toLower],
  [R.equals('CANCELLED'), R.toLower],
  [R.equals('ERROR'), R.toLower],
  [R.equals('FAILED'), R.toLower],
  [R.equals('COMPLETE'), R.toLower],
  [R.T, R.identity],
]);

const resolvers = {
  Project: {
    customer: async (project, args, req) => {
      const dao = getDao(req);
      return dao.getCustomerByProjectId(req.credentials, project.id);
    },
    users: async (project, args, req) => {
      const dao = getDao(req);
      return dao.getUsersByProjectId(req.credentials, project.id);
    },
    notifications: async (project, args, req) => {
      const dao = getDao(req);

      const args_ = R.compose(
        R.over(R.lensProp('type'), notificationTypeToString),
      )(args);

      return dao.getNotificationsByProjectId(
        req.credentials,
        project.id,
        args_,
      );
    },
    openshift: async (project, args, req) => {
      const dao = getDao(req);
      return dao.getOpenshiftByProjectId(req.credentials, project.id);
    },
    environments: async (project, args, req) => {
      const dao = getDao(req);
      const input = R.compose(R.over(R.lensProp('type'), envTypeToString))(
        args,
      );
      return dao.getEnvironmentsByProjectId(req.credentials, project.id, input);
    },
  },
  Environment: {
    project: async (environment, args, req) => {
      const dao = getDao(req);
      return dao.getProjectByEnvironmentId(req.credentials, environment.id);
    },
    deployments: async (environment, args, req) => {
      const dao = getDao(req);
      return dao.getDeploymentsByEnvironmentId(req.credentials, environment.id);
    },
    hoursMonth: async (environment, args, req) => {
      const dao = getDao(req);
      return dao.getEnvironmentHoursMonthByEnvironmentId(
        req.credentials,
        environment.id,
        args,
      );
    },
    storages: async (environment, args, req) => {
      const dao = getDao(req);
      return dao.getEnvironmentStorageByEnvironmentId(
        req.credentials,
        environment.id,
      );
    },
    storageMonth: async (environment, args, req) => {
      const dao = getDao(req);
      return dao.getEnvironmentStorageMonthByEnvironmentId(
        req.credentials,
        environment.id,
        args,
      );
    },
    hitsMonth: async (environment, args, req) => {
      const dao = getDao(req);
      return dao.getEnvironmentHitsMonthByEnvironmentId(
        req.credentials,
        environment.openshiftProjectName,
        args,
      );
    },
  },
  Deployment: {
    environment: async (deployment, args, req) => {
      const dao = getDao(req);
      return dao.getEnvironmentByDeploymentId(req.credentials, deployment.id);
    },
  },
  Notification: {
    __resolveType(obj) {
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
    users: async ({ id }, args, req) => {
      const dao = getDao(req);
      return dao.getUsersByCustomerId(req.credentials, id);
    },
  },
  User: {
    sshKeys: async ({ id }, args, req) => {
      const dao = getDao(req);
      return dao.getUserSshKeys(req.credentials, id);
    },
  },
  Query: {
    userBySshKey: async (root, args, req) => {
      const dao = getDao(req);
      return dao.getUserBySshKey(req.credentials, args);
    },
    customerByName: async (root, args, req) => {
      const dao = getDao(req);
      return dao.getCustomerByName(req.credentials, args);
    },
    projectByGitUrl: async (root, args, req) => {
      const dao = getDao(req);
      return dao.getProjectByGitUrl(req.credentials, args);
    },
    projectByName: async (root, args, req) => {
      const dao = getDao(req);
      return dao.getProjectByName(req.credentials, args);
    },
    environmentByName: async (root, args, req) => {
      const dao = getDao(req);
      return dao.getEnvironmentByName(req.credentials, args);
    },
    environmentByOpenshiftProjectName: async (root, args, req) => {
      const dao = getDao(req);
      return dao.getEnvironmentByOpenshiftProjectName(req.credentials, args);
    },
    deploymentByRemoteId: async (root, args, req) => {
      const dao = getDao(req);
      return dao.getDeploymentByRemoteId(req.credentials, args);
    },
    allProjects: async (root, args, req) => {
      const dao = getDao(req);
      return dao.getAllProjects(req.credentials, args);
    },
    allCustomers: async (root, args, req) => {
      const dao = getDao(req);
      return dao.getAllCustomers(req.credentials, args);
    },
    allOpenshifts: async (root, args, req) => {
      const dao = getDao(req);
      return dao.getAllOpenshifts(req.credentials, args);
    },
    // @TODO: check if we need these
    // allUnassignedNotifications: async (root, args, req) => {
    //   const dao = getDao(req);
    //   const args_ = R.compose(
    //     R.over(R.lensProp('type'), notificationTypeToString),
    //   )(args);

    //   return dao.getUnassignedNotifications(req.credentials, args_);
    // },
    allEnvironments: async (root, args, req) => {
      const dao = getDao(req);
      const input = R.compose(R.over(R.lensProp('type'), envTypeToString))(
        args,
      );
      return dao.getAllEnvironments(req.credentials, input);
    },
  },
  Mutation: {
    addCustomer: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addCustomer(req.credentials, args.input);
      return ret;
    },
    updateCustomer: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.updateCustomer(req.credentials, args.input);
      return ret;
    },
    deleteCustomer: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteCustomer(req.credentials, args.input);
      return ret;
    },
    deleteAllCustomers: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteAllCustomers(req.credentials, args);
      return ret;
    },
    addOrUpdateEnvironment: async (root, args, req) => {
      const dao = getDao(req);

      const input = R.compose(
        R.over(R.lensProp('environmentType'), envTypeToString),
        R.over(R.lensProp('deployType'), deployTypeToString),
      )(args.input);

      const ret = await dao.addOrUpdateEnvironment(req.credentials, input);
      return ret;
    },
    updateEnvironment: async (root, args, req) => {
      const input = R.compose(
        omitPatchKeyIfUndefined('deployType'),
        omitPatchKeyIfUndefined('environmentType'),
        R.over(R.lensPath(['patch', 'environmentType']), envTypeToString),
        R.over(R.lensPath(['patch', 'deployType']), deployTypeToString),
      )(args.input);

      const dao = getDao(req);
      const ret = await dao.updateEnvironment(req.credentials, input);
      return ret;
    },
    deleteEnvironment: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteEnvironment(req.credentials, args.input);
      return ret;
    },
    deleteAllEnvironments: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteAllEnvironments(req.credentials, args);
      return ret;
    },
    addOrUpdateEnvironmentStorage: async (root, args, req) => {
      const dao = getDao(req);

      const ret = await dao.addOrUpdateEnvironmentStorage(
        req.credentials,
        args.input,
      );
      return ret;
    },
    addNotificationSlack: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addNotificationSlack(req.credentials, args.input);
      return ret;
    },
    updateNotificationSlack: async (root, args, req) => {
      const dao = getDao(req);

      const ret = await dao.updateNotificationSlack(
        req.credentials,
        args.input,
      );
      return ret;
    },
    deleteNotificationSlack: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteNotificationSlack(
        req.credentials,
        args.input,
      );
      return ret;
    },
    deleteAllNotificationSlacks: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteAllNotificationSlacks(req.credentials, args);
      return ret;
    },
    addNotificationRocketChat: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addNotificationRocketChat(
        req.credentials,
        args.input,
      );
      return ret;
    },
    updateNotificationRocketChat: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.updateNotificationRocketChat(
        req.credentials,
        args.input,
      );
      return ret;
    },
    deleteNotificationRocketChat: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteNotificationRocketChat(
        req.credentials,
        args.input,
      );
      return ret;
    },
    deleteAllNotificationRocketChats: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteAllNotificationRocketChats(
        req.credentials,
        args,
      );
      return ret;
    },
    addNotificationToProject: async (root, args, req) => {
      const dao = getDao(req);

      const input = R.compose(
        R.over(R.lensProp('notificationType'), notificationTypeToString),
      )(args.input);

      const ret = await dao.addNotificationToProject(req.credentials, input);
      return ret;
    },
    removeNotificationFromProject: async (root, args, req) => {
      const dao = getDao(req);
      const input = R.compose(
        R.over(R.lensProp('notificationType'), notificationTypeToString),
      )(args.input);

      const ret = await dao.removeNotificationFromProject(
        req.credentials,
        input,
      );
      return ret;
    },
    removeAllNotificationsFromAllProjects: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.removeAllNotificationsFromAllProjects(
        req.credentials,
        args,
      );
      return ret;
    },
    addOpenshift: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addOpenshift(req.credentials, args.input);
      return ret;
    },
    updateOpenshift: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.updateOpenshift(req.credentials, args.input);
      return ret;
    },
    deleteOpenshift: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteOpenshift(req.credentials, args.input);
      return ret;
    },
    deleteAllOpenshifts: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteAllOpenshifts(req.credentials, args);
      return ret;
    },
    addProject: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addProject(req.credentials, args.input);
      return ret;
    },
    updateProject: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.updateProject(req.credentials, args.input);
      return ret;
    },
    deleteProject: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteProject(req.credentials, args.input);
      return ret;
    },
    deleteAllProjects: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteAllProjects(req.credentials, args);
      return ret;
    },
    addSshKey: async (root, args, req) => {
      const dao = getDao(req);
      const input = R.over(R.lensProp('keyType'), sshKeyTypeToString)(
        args.input,
      );
      const ret = await dao.addSshKey(req.credentials, input);
      return ret;
    },
    updateSshKey: async (root, args, req) => {
      // There is a possibility the sshKeyTypeToString transformation
      // sets patch.keyType = undefined. This is not acceptable, therefore
      // we need to omit the key from the patch object completely
      // (null will still be accepted, since it should signal erasure of a field)
      const input = R.compose(
        omitPatchKeyIfUndefined('keyType'),
        R.over(R.lensPath(['patch', 'keyType']), sshKeyTypeToString),
      )(args.input);

      // TODO: should we validate the ssh-key / value format?

      const dao = getDao(req);
      const ret = await dao.updateSshKey(req.credentials, input);
      return ret;
    },
    deleteSshKey: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteSshKey(req.credentials, args.input);
      return ret;
    },
    deleteAllSshKeys: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteAllSshKeys(req.credentials, args);
      return ret;
    },
    removeAllSshKeysFromAllUsers: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.removeAllSshKeysFromAllUsers(req.credentials, args);
      return ret;
    },
    addUser: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addUser(req.credentials, args.input);
      return ret;
    },
    updateUser: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.updateUser(req.credentials, args.input);
      return ret;
    },
    deleteUser: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteUser(req.credentials, args.input);
      return ret;
    },
    deleteAllUsers: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteAllUsers(req.credentials, args);
      return ret;
    },
    addUserToCustomer: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addUserToCustomer(req.credentials, args.input);
      return ret;
    },
    removeUserFromCustomer: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.removeUserFromCustomer(req.credentials, args.input);
      return ret;
    },
    removeAllUsersFromAllCustomers: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.removeAllUsersFromAllCustomers(
        req.credentials,
        args,
      );
      return ret;
    },
    addUserToProject: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addUserToProject(req.credentials, args.input);
      return ret;
    },
    removeUserFromProject: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.removeUserFromProject(req.credentials, args.input);
      return ret;
    },
    removeAllUsersFromAllProjects: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.removeAllUsersFromAllProjects(
        req.credentials,
        args,
      );
      return ret;
    },
    addDeployment: async (root, args, req) => {
      const dao = getDao(req);
      const input = R.over(R.lensProp('status'), deploymentStatusTypeToString)(
        args.input,
      );
      const ret = await dao.addDeployment(req.credentials, input);
      return ret;
    },
    deleteDeployment: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteDeployment(req.credentials, args.input);
      return ret;
    },
    updateDeployment: async (root, args, req) => {
      const dao = getDao(req);
      const input = R.over(R.lensPath(['patch', 'status']), deploymentStatusTypeToString)(
        args.input,
      );
      const ret = await dao.updateDeployment(req.credentials, input);
      return ret;
    },
  },
  Date: GraphQLDate,
};

module.exports = {
  deployTypeToString,
  envTypeToString,
  schema: makeExecutableSchema({ typeDefs, resolvers }),
};
