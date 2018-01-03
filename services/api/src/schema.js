
const R = require('ramda');
const { makeExecutableSchema } = require('graphql-tools');

const typeDefs = `
  enum SshKeyType {
    SSH_RSA
    SSH_ED25519
  }

  enum GitType {
    BRANCH
    PULLREQUEST
  }

  enum EnvType {
    PRODUCTION
    DEVELOPMENT
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

  type NotificationSlack {
    id: Int
    name: String
    webhook: String
    channel: String
  }

  union Notification = NotificationSlack

  type Project {
    id: Int
    name: String
    customer: Customer
    git_url: String
    notifications(type: String): [Notification]
    active_systems_deploy: String
    active_systems_remove: String
    branches: String
    production_environment: String
    pullrequests: Boolean
    openshift: Openshift
    sshKeys: [SshKey]
    environments: [Environment]
    created: String
  }

  type Environment {
    id: Int
    name: String
    project: Project
    git_type: String
    environment_type: String
    openshift_projectname: String
    updated: String
    created: String
  }

  input DeleteEnvironmentInput {
    name: String!
    project: String!
  }

  type Query {
    projectByName(name: String!): Project
    projectByGitUrl(gitUrl: String!): Project
    allProjects(createdAfter: String, gitUrl: String): [Project]
    allCustomers(createdAfter: String): [Customer]
    allOpenshifts: [Openshift]
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
    openshift: Int!
    active_systems_deploy: String
    active_systems_remove: String
    branches: String
    pullrequests: Boolean
    production_environment: String
  }

  input EnvironmentInput {
    name: String!
    project: Int!
    git_type: GitType!
    environment_type: EnvType!
    openshift_projectname: String!
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

  input NotificationSlackInput {
    name: String!
    webhook: String!
    channel: String!
  }

  input DeleteNotificationSlackInput {
    name: String!
  }

  input NotificationToProjectInput {
    project: String!
    notificationType: String!
    notificationName: String!
  }

  input RemoveNotificationFromProjectInput {
    project: String!
    notificationType: String!
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
    id: Int!
  }

  type Mutation {
    addProject(input: ProjectInput!): Project
    deleteProject(input: DeleteProjectInput!): String
    addOrUpdateEnvironment(input: EnvironmentInput!): Environment
    deleteEnvironment(input: DeleteEnvironmentInput!): String
    addSshKey(input: SshKeyInput!): SshKey
    deleteSshKey(input: DeleteSshKeyInput!): String
    addCustomer(input: CustomerInput!): Customer
    deleteCustomer(input: DeleteCustomerInput!): String
    addOpenshift(input: OpenshiftInput!): Openshift
    deleteOpenshift(input: DeleteOpenshiftInput!): String
    addNotificationSlack(input: NotificationSlackInput!): NotificationSlack
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

const sshKeyTypeToString = R.cond([
  [R.equals('SSH_RSA'), R.always('ssh-rsa')],
  [R.equals('SSH_ED25519'), R.always('ssh-ed25519')],
  [R.T, R.identity],
]);

const gitTypeToString = R.cond([
  [R.equals('BRANCH'), R.toLower],
  [R.equals('PULLREQUEST'), R.toLower],
  [R.T, R.identity],
]);

const envTypeToString = R.cond([
  [R.equals('PRODUCTION'), R.toLower],
  [R.equals('DEVELOPMENT'), R.toLower],
  [R.T, R.identity],
]);

const getCtx = req => req.app.get('context');
const getDao = req => getCtx(req).dao;

const resolvers = {
  Project: {
    customer: async (project, args, req) => {
      const dao = getDao(req);
      return await dao.getCustomerByProjectId(req.credentials, project.id);
    },
    sshKeys: async (project, args, req) => {
      const dao = getDao(req);
      return await dao.getSshKeysByProjectId(req.credentials, project.id);
    },
    notifications: async (project, args, req) => {
      const dao = getDao(req);
      return await dao.getNotificationsByProjectId(
        req.credentials,
        project.id,
        args,
      );
    },
    openshift: async (project, args, req) => {
      const dao = getDao(req);
      return await dao.getOpenshiftByProjectId(req.credentials, project.id);
    },
    environments: async (project, args, req) => {
      const dao = getDao(req);
      console.log(project);
      return await dao.getEnvironmentsByProjectId(req.credentials, project.id);
    },
  },
  Environment: {
    project: async (environment, args, req) => {
      const dao = getDao(req);
      return await dao.getProjectByEnvironmentId(
        req.credentials,
        environment.id,
      );
    },
  },
  Notification: {
    __resolveType(obj, context, info) {
      switch (obj.type) {
        case 'slack':
          return 'NotificationSlack';
        default:
          return null;
      }
    },
  },
  Customer: {
    sshKeys: async (customer, args, req) => {
      const dao = getDao(req);
      return await dao.getSshKeysByCustomerId(req.credentials, customer.id);
    },
  },
  Query: {
    projectByGitUrl: async (root, args, req) => {
      const dao = getDao(req);
      return await dao.getProjectByGitUrl(req.credentials, args);
    },
    projectByName: async (root, args, req) => {
      const dao = getDao(req);
      return await dao.getProjectByName(req.credentials, args);
    },
    allProjects: async (root, args, req) => {
      const dao = getDao(req);
      return await dao.getAllProjects(req.credentials, args);
    },
    allCustomers: async (root, args, req) => {
      const dao = getDao(req);
      return await dao.getAllCustomers(req.credentials, args);
    },
    allOpenshifts: async (root, args, req) => {
      const dao = getDao(req);
      return await dao.getAllOpenshifts(req.credentials, args);
    },
  },
  Mutation: {
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
      const input = R.over(R.lensProp('keyType'), sshKeyTypeToString)(args.input);
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
    addNotificationSlack: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addNotificationSlack(req.credentials, args.input);
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
      const ret = await dao.addNotificationToProject(
        req.credentials,
        args.input,
      );
      return ret;
    },
    removeNotificationFromProject: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.removeNotificationFromProject(
        req.credentials,
        args.input,
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
        R.over(R.lensProp('git_type'), gitTypeToString),
      )(args.input);

      const ret = await dao.addOrUpdateEnvironment(req.credentials, input);
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
};

module.exports = {
  gitTypeToString,
  envTypeToString,
  schema: makeExecutableSchema({ typeDefs, resolvers }),
};
