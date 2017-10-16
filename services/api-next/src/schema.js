const R = require('ramda');
const { makeExecutableSchema } = require('graphql-tools');

const typeDefs = `
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

  input ProjectInput {
    name: String
    customer: String
    git_url: String
    slackId: Int
    active_systems_deploy: String
    active_systems_remove: String
    branches: String
    pullrequests: Boolean
    openshift: String
    sshKeys: [String]
  }

  type Mutation {
    addProject(input: ProjectInput!): Project
  }
`;


const getCtx = (req) => req.app.get('context');

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
    addProject: (root, args, req) => {
      // Do database stuff

      return {
        id: 123,
        name: 'My Customer',
        comment: 'Mock data',
        private_key: 'some private key',
        created: Date.now().toString(),
      };
    },
  },
};

module.exports = makeExecutableSchema({ typeDefs, resolvers });
