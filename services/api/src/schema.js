const { makeExecutableSchema } = require('graphql-tools');

const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');

module.exports = {
  schema: makeExecutableSchema({ typeDefs, resolvers }),
};
