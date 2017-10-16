const R = require('ramda');
const { makeExecutableSchema } = require('graphql-tools');

const typeDefs = `
  enum SshKeyType {
    SSH_RSA
    SSH_ED25519
  }

  type SshKey {
    id: Int
    name: String
    keyValue: String
    keyType: SshKeyType
    created: String
  }

  type Customer {
    id: Int
    name: String
    comment: String
    private_key: String
    created: String
  }

  type Openshift {
    id: Int
    name: String
    console_url: String
    token: String
    router_pattern: String
    project_user: String
    sshKeys: [SshKey]
    created: String
  }

  type Slack {
    id: Int
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
    allProjects(createdAfter: String): [Project]
    allCustomers(createdAfter: String): [Customer]
  }

  input SshKeyInput {
    name: String
    keyValue: String!
    keyType: SshKeyType
  }

  input ProjectInput {
    name: String!
    customer: String!
    git_url: String!
    slackId: Int!
    active_systems_deploy: String!
    active_systems_remove: String!
    branches: String!
    pullrequests: Boolean!
    openshift: String!
    sshKeys: [SshKeyInput]!
  }

  type Mutation {
    addProject(input: ProjectInput!): Int
  }
`;


const getCtx = (req) => req.app.get('context');
const getDao = (req) => getCtx(req).dao;

const resolvers = {
  Query: {
    projectByName: (root, args, req) => {
    },
    projectByGitUrl: (root, args, req) => {
    },
    allProjects: (root, args, req) => {
    },
    allCustomers: (root, args, req) => {
    },
  },
  Mutation: {
    addProject: async (root, args, req) => {
      // Do database stuff
      const dao = getDao(req);

      const id = await dao.addProject(args.input)

      return id;
    },
  },
};

module.exports = makeExecutableSchema({ typeDefs, resolvers });
