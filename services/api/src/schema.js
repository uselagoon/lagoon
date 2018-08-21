// @flow

const R = require('ramda');
const { makeExecutableSchema } = require('graphql-tools');
const GraphQLDate = require('graphql-iso-date');

const typeDefs = `

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

  type SshKey {
    id: Int
    name: String
    keyValue: String
    keyType: String
    created: String
  }

  type Customer {
    id: Int
    name: String
    comment: String
    private_key: String
    sshKeys: [SshKey]
    created: String
  }

  type Openshift {
    id: Int
    name: String
    console_url: String
    token: String
    router_pattern: String
    project_user: String
    ssh_host: String
    ssh_port: String
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
    git_url: String
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
    active_systems_deploy: String
    """
    Which internal Lagoon System is responsible for promoting
    Currently only 'lagoon_openshiftBuildDeploy' exists
    """
    active_systems_promote: String
    """
    Which internal Lagoon System is responsible for promoting
    Currently only 'lagoon_openshiftRemove' exists
    """
    active_systems_remove: String
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
    production_environment: String
    """
    Should this project have auto idling enabled (\`1\` or \`0\`)
    """
    auto_idle: Int
    """
    Should storage for this environment be calculated (\`1\` or \`0\`)
    """
    storage_calc: Int
    """
    Reference to OpenShift Object this Project should be deployed to
    """
    openshift: Openshift
    """
    Pattern of OpenShift Project/Namespace that should be generated, default: \`$\{project\}-$\{environmentname\}\`
    """
    openshift_project_pattern: String
    """
    Which Developer SSH keys should have access to this project
    """
    sshKeys: [SshKey]
    """
    Deployed Environments for this Project
    """
    environments(
      """
      Filter by Environment Type
      """
      type: EnvType,
      """
      Include deleted Environments (by default deleted environment are hidden)
      """
      include_deleted: Boolean
    ): [Environment]
    """
    Creation Timestamp of Project
    """
    created: String
  }

  type Environment {
    id: Int
    name: String
    project: Project
    deploy_type: String
    environment_type: String
    openshift_projectname: String
    updated: String
    created: String
    deleted: String
    hours_month(month: Date): EnvironmentHoursMonth
    storages: [EnvironmentStorage]
    storage_month(month: Date): EnvironmentStorageMonth
    hits_month(month: Date): EnviornmentHitsMonth
    lagoon_route: String
    lagoon_routes: String
  }

  type EnviornmentHitsMonth {
    total: Int
  }


  type EnvironmentStorage {
    id: Int
    environment: Environment
    persistent_storage_claim: String
    bytes_used: Float
    updated: String
  }

  type EnvironmentStorageMonth {
    month: String
    bytes_used: Float
  }

  type EnvironmentHoursMonth {
    month: String
    hours: Int
  }

  input DeleteEnvironmentInput {
    name: String!
    project: Int!
  }

  type Query {
    customerByName(name: String!): Customer
    projectByName(name: String!): Project
    projectByGitUrl(gitUrl: String!): Project
    environmentByName(name: String!, project: Int!): Environment
    environmentByOpenshiftProjectName(openshiftProjectName: String!): Environment
    allProjects(createdAfter: String, gitUrl: String): [Project]
    allCustomers(createdAfter: String): [Customer]
    allOpenshifts: [Openshift]
    allEnvironments(createdAfter: String): [Environment]
  }

  input SshKeyInput {
    id: Int
    name: String!
    keyValue: String!
    keyType: SshKeyType
  }

  input DeleteSshKeyInput {
    name: String!
  }

  input ProjectInput {
    id: Int
    name: String!
    customer: Int!
    git_url: String!
    subfolder: String
    openshift: Int!
    openshift_project_pattern: String
    active_systems_deploy: String
    active_systems_promote: String
    active_systems_remove: String
    branches: String
    pullrequests: String
    production_environment: String
    auto_idle: Int
    storage_calc: Int
  }

  input EnvironmentInput {
    name: String!
    project: Int!
    deploy_type: DeployType!
    environment_type: EnvType!
    openshift_projectname: String!
  }

  input EnvironmentStorageInput {
    environment: Int!
    persistent_storage_claim: String!
    bytes_used: Int!
  }

  input CustomerInput {
    id: Int
    name: String!
    comment: String
    private_key: String
  }

  input OpenshiftInput {
    id: Int
    name: String!
    console_url: String!
    token: String
    router_pattern: String
    project_user: String
    ssh_host: String
    ssh_port: String
  }

  input DeleteOpenshiftInput {
    name: String!
  }

  input DeleteCustomerInput {
    name: String!
  }

  input NotificationRocketChatInput {
    name: String!
    webhook: String!
    channel: String!
  }

  input NotificationSlackInput {
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

  input NotificationToProjectInput {
    project: String!
    notificationType: NotificationType!
    notificationName: String!
  }

  input RemoveNotificationFromProjectInput {
    project: String!
    notificationType: NotificationType!
    notificationName: String!
  }

  input SshKeyToProjectInput {
    project: String!
    sshKey: String!
  }

  input RemoveSshKeyFromProjectInput {
    project: String!
    sshKey: String!
  }

  input SshKeyToCustomerInput {
    customer: String!
    sshKey: String!
  }

  input RemoveSshKeyFromCustomerInput {
    customer: String!
    sshKey: String!
  }

  input DeleteProjectInput {
    project: String!
  }

  input UpdateProjectPatchInput {
    name: String
    customer: Int
    git_url: String
    subfolder: String
    active_systems_deploy: String
    active_systems_remove: String
    branches: String
    production_environment: String
    auto_idle: Int
    storage_calc: Int
    pullrequests: String
    openshift: Int
    openshift_project_pattern: String
  }

  input UpdateProjectInput {
    id: Int!
    patch: UpdateProjectPatchInput!
  }

  input UpdateCustomerPatchInput {
    name: String
    comment: String
    private_key: String
    created: String
  }

  input UpdateCustomerInput {
    id: Int!
    patch: UpdateCustomerPatchInput!
  }

  input UpdateOpenshiftPatchInput {
    name: String
    console_url: String
    token: String
    router_pattern: String
    project_user: String
    ssh_host: String
    ssh_port: String
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
    deploy_type: DeployType
    environment_type: EnvType
    openshift_projectname: String
    lagoon_route: String
    lagoon_routes: String
    monitoring_urls: String
  }

  input UpdateEnvironmentInput {
    name: String!
    id: Int!
    patch: UpdateEnvironmentPatchInput
  }

  type Mutation {
    updateEnvironment(input: UpdateEnvironmentInput!): Environment
    updateSshKey(input: UpdateSshKeyInput!): SshKey
    updateNotificationRocketChat(input: UpdateNotificationRocketChatInput!): NotificationRocketChat
    updateNotificationSlack(input: UpdateNotificationSlackInput!): NotificationSlack
    updateOpenshift(input: UpdateOpenshiftInput!): Openshift
    updateCustomer(input: UpdateCustomerInput!): Customer
    updateProject(input: UpdateProjectInput!): Project
    addProject(input: ProjectInput!): Project
    deleteProject(input: DeleteProjectInput!): String
    addOrUpdateEnvironment(input: EnvironmentInput!): Environment
    addOrUpdateEnvironmentStorage(input: EnvironmentStorageInput!): EnvironmentStorage
    deleteEnvironment(input: DeleteEnvironmentInput!): String
    addSshKey(input: SshKeyInput!): SshKey
    deleteSshKey(input: DeleteSshKeyInput!): String
    addCustomer(input: CustomerInput!): Customer
    deleteCustomer(input: DeleteCustomerInput!): String
    addOpenshift(input: OpenshiftInput!): Openshift
    deleteOpenshift(input: DeleteOpenshiftInput!): String
    addNotificationRocketChat(input: NotificationRocketChatInput!): NotificationRocketChat
    addNotificationSlack(input: NotificationSlackInput!): NotificationSlack
    deleteNotificationRocketChat(input: DeleteNotificationRocketChatInput!): String
    deleteNotificationSlack(input: DeleteNotificationSlackInput!): String
    addNotificationToProject(input: NotificationToProjectInput!): Project
    removeNotificationFromProject(input: RemoveNotificationFromProjectInput!): Project
    addSshKeyToProject(input: SshKeyToProjectInput!): Project
    removeSshKeyFromProject(input: RemoveSshKeyFromProjectInput!): Project
    addSshKeyToCustomer(input: SshKeyToCustomerInput!): Customer
    removeSshKeyFromCustomer(input: RemoveSshKeyFromCustomerInput!): Customer
    truncateTable(tableName: String!): String
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

const getCtx = req => req.app.get('context');
const getDao = req => getCtx(req).dao;

const resolvers = {
  Project: {
    customer: async (project, args, req) => {
      const dao = getDao(req);
      return dao.getCustomerByProjectId(req.credentials, project.id);
    },
    sshKeys: async (project, args, req) => {
      const dao = getDao(req);
      return dao.getSshKeysByProjectId(req.credentials, project.id);
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
    hours_month: async (environment, args, req) => {
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
    storage_month: async (environment, args, req) => {
      const dao = getDao(req);
      return dao.getEnvironmentStorageMonthByEnvironmentId(
        req.credentials,
        environment.id,
        args,
      );
    },
    hits_month: async (environment, args, req) => {
      const dao = getDao(req);
      return dao.getEnvironmentHitsMonthByEnvironmentId(
        req.credentials,
        environment.openshift_projectname,
        args,
      );
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
    sshKeys: async (customer, args, req) => {
      const dao = getDao(req);
      return dao.getSshKeysByCustomerId(req.credentials, customer.id);
    },
  },
  Query: {
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
      return await dao.getEnvironmentByName(req.credentials, args);
    },
    environmentByOpenshiftProjectName: async (root, args, req) => {
      const dao = getDao(req);
      return dao.getEnvironmentByOpenshiftProjectName(req.credentials, args);
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
    // allUnassignedSshKeys: async (root, args, req) => {
    //   const dao = getDao(req);
    //   return dao.getUnassignedSshKeys(req.credentials);
    // },
    // allSshKeys: async (root, args, req) => {
    //   const dao = getDao(req);
    //   return dao.getAllSshKeys(req.credentials);
    // },
    // allUnassignedNotifications: async (root, args, req) => {
    //   const dao = getDao(req);
    //   const args_ = R.compose(
    //     R.over(R.lensProp('type'), notificationTypeToString),
    //   )(args);

    //   return dao.getUnassignedNotifications(req.credentials, args_);
    // },
    allEnvironments: async (root, args, req) => {
      const dao = getDao(req);
      return dao.getAllEnvironments(req.credentials, args);
    },
  },
  Mutation: {
    updateEnvironment: async (root, args, req) => {
      const input = R.compose(
        omitPatchKeyIfUndefined('deploy_type'),
        omitPatchKeyIfUndefined('environment_type'),
        R.over(R.lensPath(['patch', 'environment_type']), envTypeToString),
        R.over(R.lensPath(['patch', 'deploy_type']), deployTypeToString),
      )(args.input);

      const dao = getDao(req);
      const ret = await dao.updateEnvironment(req.credentials, input);
      return ret;
    },

    updateSshKey: async (root, args, req) => {
      // There is a possibility the sshKeyTypeToString transformation
      // sets patch.keyType = undefined. This is not acceptable, therefore
      // we need to omit the key from the patch object completely
      // (null will still be accepted, since it should signal erasal of a field)
      const input = R.compose(
        omitPatchKeyIfUndefined('keyType'),
        R.over(R.lensPath(['patch', 'keyType']), sshKeyTypeToString),
      )(args.input);

      // TODO: should we validate the ssh-key / value format?

      const dao = getDao(req);
      const ret = await dao.updateSshKey(req.credentials, input);
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
    updateNotificationSlack: async (root, args, req) => {
      const dao = getDao(req);

      const ret = await dao.updateNotificationSlack(
        req.credentials,
        args.input,
      );
      return ret;
    },
    updateOpenshift: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.updateOpenshift(req.credentials, args.input);
      return ret;
    },

    updateCustomer: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.updateCustomer(req.credentials, args.input);
      return ret;
    },
    updateProject: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.updateProject(req.credentials, args.input);
      return ret;
    },
    addProject: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addProject(req.credentials, args.input);
      return ret;
    },
    deleteProject: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteProject(req.credentials, args.input);
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
    deleteSshKey: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteSshKey(req.credentials, args.input);
      return ret;
    },
    addCustomer: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addCustomer(req.credentials, args.input);
      return ret;
    },
    deleteCustomer: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteCustomer(req.credentials, args.input);
      return ret;
    },
    addOpenshift: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addOpenshift(req.credentials, args.input);
      return ret;
    },
    deleteOpenshift: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteOpenshift(req.credentials, args.input);
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
    addNotificationSlack: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addNotificationSlack(req.credentials, args.input);
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
    deleteNotificationSlack: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteNotificationSlack(
        req.credentials,
        args.input,
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
    addSshKeyToProject: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addSshKeyToProject(req.credentials, args.input);
      return ret;
    },
    removeSshKeyFromProject: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.removeSshKeyFromProject(
        req.credentials,
        args.input,
      );
      return ret;
    },
    addSshKeyToCustomer: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addSshKeyToCustomer(req.credentials, args.input);
      return ret;
    },
    removeSshKeyFromCustomer: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.removeSshKeyFromCustomer(
        req.credentials,
        args.input,
      );
      return ret;
    },
    addOrUpdateEnvironment: async (root, args, req) => {
      const dao = getDao(req);

      const input = R.compose(
        R.over(R.lensProp('environment_type'), envTypeToString),
        R.over(R.lensProp('deploy_type'), deployTypeToString),
      )(args.input);

      const ret = await dao.addOrUpdateEnvironment(req.credentials, input);
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
    deleteEnvironment: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.deleteEnvironment(req.credentials, args.input);
      return ret;
    },
    truncateTable: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.truncateTable(req.credentials, args);
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
