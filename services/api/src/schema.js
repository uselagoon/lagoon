const R = require("ramda");
const { makeExecutableSchema } = require("graphql-tools");

const typeDefs = `
  enum SshKeyType {
    SSH_RSA
    SSH_ED25519
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
    name: String!
    keyValue: String!
    keyType: String
  }

  input DeleteSshKeyInput {
    name: String!
  }

  input ProjectInput {
    name: String!
    customer: String!
    git_url: String!
    openshift: String!
    active_systems_deploy: String
    active_systems_remove: String
    branches: String
    pullrequests: Boolean
    production_environment: String
    sshKeys: [String]
  }

  input EnvironmentInput {
    name: String!
    project: String!
    git_type: String!
    environment_type: String!
    openshift_projectname: String!
  }

  input CustomerInput {
    name: String!
    comment: String
    private_key: String
    sshKeys: [String]
  }

  input OpenshiftInput {
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

  input DeleteProjectInput {
    name: String!
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
    truncateTable(tableName: String!): String
  }
`;

const getCtx = req => req.app.get("context");
const getDao = req => getCtx(req).dao;

const resolvers = {
  Project: {
    customer: async (project, args, req) => {
      const dao = getDao(req);
      return await dao.getCustomerByProjectId(req.credentials, project.id);
    },
    sshKeys: async (project, args, req) => {
      const dao = getDao(req);
      return await dao.getSshKeysByProjectId(req.credentials, project.id)
    },
    notifications: async (project, args, req) => {
      const dao = getDao(req);
      return await dao.getNotificationsByProjectId(req.credentials, project.id, args)
    },
    openshift: async (project, args, req) => {
      const dao = getDao(req);
      return await dao.getOpenshiftByProjectId(req.credentials, project.id);
    },
    environments: async (project, args, req) => {
      const dao = getDao(req);
      return await dao.getEnvironmentsByProjectId(req.credentials, project.id);
    }
  },
  Environment: {
    project: async (environment, args, req) => {
      const dao = getDao(req);
      return await dao.getProjectByEnvironmentId(req.credentials, environment.id);
    }
  },
  Notification: {
    __resolveType(obj, context, info){
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
      return await dao.getSshKeysByCustomerId(req.credentials, customer.id)
    }
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
    }
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
      const ret = await dao.addSshKey(req.credentials, args.input);
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
      const ret = await dao.deleteNotificationSlack(req.credentials, args.input);
      return ret;
    },
    addNotificationToProject: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addNotificationToProject(req.credentials, args.input);
      return ret;
    },
    removeNotificationFromProject: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.removeNotificationFromProject(req.credentials, args.input);
      return ret;
    },
    addOrUpdateEnvironment: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addOrUpdateEnvironment(req.credentials, args.input);
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
    }
  }
};

module.exports = makeExecutableSchema({ typeDefs, resolvers });
