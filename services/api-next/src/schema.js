const R = require('ramda');
const { makeExecutableSchema } = require('graphql-tools');

const typeDefs = `
  type SshKey = {
    id: Int,
    name: String,
    key: String,
    keyType: String,
    created: String
  }

  type Customer {
    id: Int,
    name: String,
    comment: String,
    private_key: String,
    created: String
  }

  type Openshift = {
    id: Int,
    name: String,
    console_url: String,
    registry: String,
    token: String,
    username: String,
    password: String,
    router_pattern: String,
    project_user: String,
    sshKeys: [SshKey],
    created: String
  }

  type Slack = {
    id: Int,
    webhook: String,
    channel: String
  }

  type Project = {
    id: Int,
    name: String,
    customer: Customer,
    git_url: String,
    slack: Slack,
    active_systems_deploy: String,
    active_systems_remove: String,
    branches: String,
    pullrequests: Boolean,
    openshift: Openshift,
    sshKeys: [SshKey],
    created: String
  }

  type Mutation {
    addCustomer(name: String!): Customer
  }
`;

const resolvers = {
  JSON: GraphQLJSON,
  Mutation: {
    addCustomer: (root, args, req) => {
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
