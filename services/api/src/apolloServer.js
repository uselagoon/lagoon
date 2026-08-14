const R = require('ramda');
const gql = require('graphql-tag');
const newrelic = require('newrelic');
const { decode } = require('jsonwebtoken');
const { getConfigFromEnv } = require('./util/config');
const {
  isLegacyToken,
  isKeycloakToken,
  getCredentialsForLegacyToken,
  getGrantForKeycloakToken,
  legacyHasPermission,
  keycloakHasPermission
} = require('./util/auth');
const { sqlClientPool } = require('./clients/sqlClient');
const esClient = require('./clients/esClient');
const { getKeycloakAdminClient } = require('./clients/keycloak-admin');
const { logger } = require('./loggers/logger');
const { userActivityLogger } = require('./loggers/userActivityLogger');
const typeDefs = require('./typeDefs');
const getResolvers = require('./resolvers');
const { keycloakGrantManager } = require('./clients/keycloakClient');
const User = require('./models/user');
const Group = require('./models/group');
const Environment = require('./models/environment');
import { ApolloServer } from '@apollo/server';
import { GraphQLError } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';


let schema;
let apolloServer;

export const getGrantOrLegacyCredsFromToken = async token => {
  const decodedToken = decode(token, { json: true, complete: true });

  if (isLegacyToken(decodedToken)) {
    try {
      const legacyCredentials = await getCredentialsForLegacyToken(token);

      const { sub, iss } = legacyCredentials;
      const username = sub ? sub : 'unknown';
      const source = iss ? iss : 'unknown';
      userActivityLogger.user_auth(
        `Authentication granted for '${username}' from '${source}'`,
        { user: legacyCredentials }
      );

      return {
        grant: null,
        legacyCredentials
      };
    } catch (e) {
      throw new GraphQLError(`Legacy token invalid: ${e.message}`, {
        extensions: { code: 'UNAUTHENTICATED' }
      });
    }
  } else if (isKeycloakToken(decodedToken)) {
    try {
      const grant = await getGrantForKeycloakToken(token);

      if (grant.access_token) {
        const {
          azp: source,
          preferred_username,
          email
        } = grant.access_token.content;
        const username = preferred_username ? preferred_username : 'unknown';

        userActivityLogger.user_auth(
          `Authentication granted for '${username} (${
            email ? email : 'unknown'
          })' from '${source}'`,
          { user: grant ? grant.access_token.content : null }
        );
      }

      return {
        grant,
        legacyCredentials: null
      };
    } catch (e) {
      throw new GraphQLError(`Keycloak token invalid: ${e.message}`, {
        extensions: { code: 'UNAUTHENTICATED' }
      });
    }
  } else {
    throw new GraphQLError(`Bearer token unrecognized`, {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
};

async function initCheck() {
  if (apolloServer) {
    return;
  }

  const resolvers = await getResolvers();
  // Fixes schema creation to allow undefined in resolve
  schema = makeExecutableSchema({
    typeDefs,
    resolvers: resolvers,
    allowUndefinedInResolve: true,
    resolverValidationOptions: {
      requireResolversForArgs: false,
      requireResolversForNonScalar: false,
      requireResolversForAllFields: false,
    }
  });

  apolloServer = new ApolloServer({
    schema: schema,
    includeStacktraceInErrorResponses: getConfigFromEnv('NODE_ENV') === 'development',
    introspection: true,
    parseOptions: {
      maxTokens: 50000
    },
    formatError: error => {
      logger.error('GraphQL field error `' + error.path + '`: ' + error.message);
      return {
        message: error.message,
        locations: error.locations,
        path: error.path,
        ...(getConfigFromEnv('NODE_ENV') === 'development'
          ? { extensions: error.extensions }
          : {})
      };
    },
    plugins: [
      // newrelic instrumentation plugin. Based heavily on https://github.com/essaji/apollo-newrelic-extension-plus
      {
        requestDidStart({ request }) {
          const operationName = R.prop('operationName', request);
          const queryString = R.prop('query', request);
          const variables = R.prop('variables', request);

        const queryObject = gql`
          ${queryString}
        `;
        const rootFieldName = queryObject.definitions[0].selectionSet.selections.reduce(
          (init, q, idx) =>
            idx === 0 ? `${q.name.value}` : `${init}, ${q.name.value}`,
          ''
        );

        // operationName is set by the client and optional. rootFieldName is
        // set by the API type defs.
        // operationName would be "getLagoonDemoProjectId" and rootFieldName
        // would be "getProjectByName" with a query like:
        // query getLagoonDemoProjectId { getProjectByName(name: "lagoon-demo") { id } }
              const transactionName = operationName ? operationName : rootFieldName;
              newrelic.setTransactionName(`graphql (${transactionName})`);
              newrelic.addCustomAttribute('gqlQuery', queryString);
              newrelic.addCustomAttribute('gqlVars', JSON.stringify(variables));

          return {
            willSendResponse: data => {
              const requestContext = data;
              newrelic.addCustomAttribute(
                'errorCount',
                R.pipe(
                  R.pathOr([], ['body', 'singleResult', 'errors']),
                  R.length
                )(requestContext)
              );
            }
          };
        }
      }
    ]
  });
}

export async function getApolloServer() {
  await initCheck();
  return apolloServer;
}

export async function getSchema() {
  await initCheck();
  return schema;
}
