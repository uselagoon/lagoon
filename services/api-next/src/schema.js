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
    created: String
  }

  type Slack {
    id: Int
    name: String
    webhook: String
    channel: String
  }

  type Project {
    id: Int
    name: String
    customer: Customer
    git_url: String
    slack: Slack
    active_systems_deploy: String
    active_systems_remove: String
    branches: String
    pullrequests: Boolean
    openshift: Openshift
    sshKeys: [SshKey]
    created: String
  }

  type Query {
    projectByName(name: String!): Project
    projectByGitUrl(gitUrl: String!): Project
    allProjects(createdAfter: String, gitUrl: String): [Project]
    allCustomers(createdAfter: String): [Customer]
  }

  input SshKeyInput {
    name: String!
    keyValue: String!
    keyType: String
  }

  input ProjectInput {
    name: String!
    customer: String!
    git_url: String!
    openshift: String!
    slack: String
    active_systems_deploy: String
    active_systems_remove: String
    branches: String
    pullrequests: Boolean
    sshKeys: [String]
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
  }

  input SlackInput {
    name: String!
    webhook: String!
    channel: String!
  }

  type Mutation {
    addProject(input: ProjectInput!): Project
    addSshKey(input: SshKeyInput!): SshKey
    addCustomer(input: CustomerInput!): Customer
    addOpenshift(input: OpenshiftInput!): Openshift
    addSlack(input: SlackInput!): Slack
    truncateTable(tableName: String!): String
  }
`;

const getCtx = req => req.app.get("context");
const getDao = req => getCtx(req).dao;

const resolvers = {
  Project: {
    customer: async (project, args, req) => {
      const dao = getDao(req);
      return await dao.getCustomerByProjectId(req.credentials, project.customer);
    },
    sshKeys: async (project, args, req) => {
      const dao = getDao(req);
      return await dao.getSshKeysByProjectId(req.credentials, project.id)
    },
    slack: async (project, args, req) => {
      const dao = getDao(req);
      return await dao.getSlackByProjectId(req.credentials, project.id)
    },
    openshift: async (project, args, req) => {
      const dao = getDao(req);
      return await dao.getOpenshiftByProjectId(req.credentials, project.id);
    }
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
    }
  },
  Mutation: {
    addProject: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addProject(req.credentials, args.input);
      return ret;
    },
    addSshKey: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addSshKey(req.credentials, args.input);
      return ret;
    },
    addCustomer: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addCustomer(req.credentials, args.input);
      return ret;
    },
    addOpenshift: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addOpenshift(req.credentials, args.input);
      return ret;
    },
    addSlack: async (root, args, req) => {
      const dao = getDao(req);
      const ret = await dao.addSlack(req.credentials, args.input);
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
