import http from 'http';
import util from 'util';
import { logger } from './loggers/logger';
import { toNumber } from './util/func';
import { getConfigFromEnv } from './util/config';
import { app, configureApp } from './app';
import { getSchema, getGrantOrLegacyCredsFromToken } from './apolloServer';
import { getKeycloakAdminClient } from './clients/keycloak-admin';
import { sqlClientPool } from './clients/sqlClient';
import { esClient } from './clients/esClient';
import { User } from './models/user';
import { Group } from './models/group';
import { Environment } from './models/environment';
import { keycloakGrantManager } from './clients/keycloakClient';
import { keycloakHasPermission, legacyHasPermission } from './util/auth';
import R from 'ramda';
import { AuthenticationError } from 'apollo-server-express';
const { useServer } = require('graphql-ws/lib/use/ws');
const { createHandler } = require('graphql-sse/lib/use/http');

export const createServer = async () => {
  logger.verbose('Starting the api...');

  await configureApp();

  const port = toNumber(getConfigFromEnv('PORT', '3000'));

  const schema = await getSchema();

  const sseHandler = createHandler({
    schema: schema,
    authenticate: async (req) => {
      const authHeader = req.raw.headers.authorization || req.raw.headers.Authorization;

      if (!authHeader) {
        logger.error('SSE: No authorization header');
        throw new AuthenticationError('Auth token missing.');
      }

      const authToken = authHeader.replace('Bearer ', '').replace('bearer ', '');

      try {
        const { grant, legacyCredentials } = await getGrantOrLegacyCredsFromToken(authToken);
        return { grant, legacyCredentials };
      } catch (e) {
        logger.error(`SSE auth failed: ${e.message}`);
        throw new AuthenticationError('Auth token invalid.');
      }
    },
    context: async (req, params) => {
      const { grant: keycloakGrant, legacyCredentials: legacyGrant } = req.context || {};

      const keycloakAdminClient = await getKeycloakAdminClient();
      const modelClients = { sqlClientPool, keycloakAdminClient, esClient };

      let currentUser: any = { id: undefined };
      let serviceAccount = {};
      let keycloakUsersGroups = [];
      let groupRoleProjectIds = [];
      let platformOwner = false;
      let platformViewer = false;

      if (keycloakGrant) {
        try {
          const userId = keycloakGrant.access_token.content.sub;
          keycloakUsersGroups = await User(modelClients).getAllGroupsForUser(userId);
          serviceAccount = await keycloakGrantManager.obtainFromClientCredentials(undefined, undefined);
          currentUser = await User(modelClients).loadUserById(userId);
          const userRoleMapping = await keycloakAdminClient.users.listRealmRoleMappings({ id: currentUser.id });
          platformOwner = userRoleMapping.some(role => role.name === 'platform-owner');
          platformViewer = userRoleMapping.some(role => role.name === 'platform-viewer');
          groupRoleProjectIds = await User(modelClients).getAllProjectsIdsForUser(currentUser.id, keycloakUsersGroups);
          await User(modelClients).userLastAccessed(currentUser);
        } catch (e) {
          logger.error('Error loading user details for SSE subscription', e.message);
        }
      }

      if (legacyGrant) {
        const { role } = legacyGrant;
        if (role === 'admin') {
          platformOwner = true;
        }
      }

      const hasPermission = keycloakGrant
        ? keycloakHasPermission(keycloakGrant, modelClients, serviceAccount, currentUser, groupRoleProjectIds)
        : legacyGrant
        ? legacyHasPermission(legacyGrant)
        : () => false;

      logger.debug('SSE: Created context', {
        hasKeycloakGrant: !!keycloakGrant,
        hasLegacyGrant: !!legacyGrant,
        platformOwner,
        platformViewer
      });

      return {
        keycloakAdminClient,
        sqlClientPool,
        hasPermission,
        keycloakGrant,
        legacyGrant,
        models: {
          UserModel: User(modelClients),
          GroupModel: Group(modelClients),
          EnvironmentModel: Environment(modelClients)
        },
        keycloakUsersGroups,
        adminScopes: { platformOwner, platformViewer },
      };
    },
    onSubscribe: async (req, params) => {
      logger.debug('SSE onSubscribe', {
        operationName: params?.operationName,
        query: params?.query,
        variables: params?.variables
      });
    },
    onNext: (req, params, result) => {
      logger.debug('SSE onNext', {
        hasResult: !!result,
        resultData: result?.data,
        errors: result?.errors
      });
    },
    onError: (req, params, errors) => {
      logger.error('SSE onError', {
        errors: errors,
        params: params
      });
    },
    onComplete: (req, params) => {
      logger.verbose('SSE connection completed', { params });
    },
  });

  const server = http.createServer(async (req, res) => {
    if (req.url?.startsWith('/graphql/stream')) {
      try {
        await sseHandler(req, res);
      } catch (error: any) {
        logger.error('SSE handler error', {
          error: error.message,
          stack: error.stack
        });
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      }
    } else {
      app(req, res);
    }
  });
  server.setTimeout(900000);

  async function setupGraphQLModules() {
try {
  const WebSocket = (await import("ws")).default;
  const schema = await getSchema();

  const wsServer = new WebSocket.Server({
    server,
    path: "/graphql",
  });

  useServer(
    {
      schema: schema,
      context: async (ctx) => {
        const connectionParams = ctx.connectionParams || {};
        let keycloakGrant = null;
        let legacyGrant = null;

        try {
          if (connectionParams.authToken) {
            const { grant, legacyCredentials } = await getGrantOrLegacyCredsFromToken(
              connectionParams.authToken,
            );
            keycloakGrant = grant;
            legacyGrant = legacyCredentials;
          }
        } catch (e) {
          logger.error(`WebSocket auth failed: ${e.message}`);
        }

        const keycloakAdminClient = await getKeycloakAdminClient();
        const modelClients = { sqlClientPool, keycloakAdminClient, esClient };

        let currentUser: any = { id: undefined };
        let serviceAccount = {};
        let keycloakUsersGroups = [];
        let groupRoleProjectIds = [];
        let platformOwner = false;
        let platformViewer = false;

        if (keycloakGrant) {
          try {
            const userId = keycloakGrant.access_token.content.sub;
            keycloakUsersGroups = await User(modelClients).getAllGroupsForUser(userId);
            serviceAccount = await keycloakGrantManager.obtainFromClientCredentials(undefined, undefined);
            currentUser = await User(modelClients).loadUserById(userId);
            const userRoleMapping = await keycloakAdminClient.users.listRealmRoleMappings({ id: currentUser.id });
            platformOwner = userRoleMapping.some(role => role.name === 'platform-owner');
            platformViewer = userRoleMapping.some(role => role.name === 'platform-viewer');
            groupRoleProjectIds = await User(modelClients).getAllProjectsIdsForUser(currentUser.id, keycloakUsersGroups);
            await User(modelClients).userLastAccessed(currentUser);
          } catch (e) {
            logger.error('Error loading user details for subscription', e.message);
          }
        }

        if (legacyGrant) {
          const { role } = legacyGrant;
          if (role === 'admin') {
            platformOwner = true;
          }
        }

        const hasPermission = keycloakGrant
          ? keycloakHasPermission(keycloakGrant, modelClients, serviceAccount, currentUser, groupRoleProjectIds)
          : legacyHasPermission(legacyGrant);

        return {
          keycloakAdminClient,
          sqlClientPool,
          hasPermission,
          keycloakGrant,
          legacyGrant,
          models: {
            UserModel: User(modelClients),
            GroupModel: Group(modelClients),
            EnvironmentModel: Environment(modelClients)
          },
          keycloakUsersGroups,
          adminScopes: { platformOwner, platformViewer },
        };
      },
      onConnect: async (ctx) => {
        const token = R.prop('authToken', ctx.connectionParams);
        if (!token) {
          logger.error('WebSocket onConnect: No auth token found in connection parameters');
          throw new AuthenticationError('Auth token missing.');
        }

        try {
          const { grant, legacyCredentials } = await getGrantOrLegacyCredsFromToken(token);
          const keycloakAdminClient = await getKeycloakAdminClient();
          const modelClients = { sqlClientPool, keycloakAdminClient, esClient };

          let currentUser: any = {};
          let serviceAccount = {};
          let keycloakUsersGroups = [];
          let groupRoleProjectIds: any[] = [];
          const keycloakGrant = grant;
          let legacyGrant = legacyCredentials ? legacyCredentials : null;
          let platformOwner = false;
          let platformViewer = false;

          if (keycloakGrant) {
            try {
              keycloakUsersGroups = await User(modelClients).getAllGroupsForUser(keycloakGrant.access_token.content.sub);
              serviceAccount = await keycloakGrantManager.obtainFromClientCredentials(undefined, undefined);
              currentUser = await User(modelClients).loadUserById(keycloakGrant.access_token.content.sub);
              const userRoleMapping = await keycloakAdminClient.users.listRealmRoleMappings({id: currentUser.id})
              for (const role of userRoleMapping) {
                if (role.name == "platform-owner") {
                  platformOwner = true
                }
                if (role.name == "platform-viewer") {
                  platformViewer = true
                }
              }
              groupRoleProjectIds = await User(modelClients).getAllProjectsIdsForUser(currentUser.id, keycloakUsersGroups);
            } catch (err) {
              logger.error('WebSocket onConnect: Error loading user context.', { error: err.message, userId: keycloakGrant.access_token.content.sub });
              throw err;
            }
          }
          if (legacyGrant) {
            const { role } = legacyGrant;
            if (role == 'admin') {
              platformOwner = true
            }
          }

          const context = {
            keycloakAdminClient,
            sqlClientPool,
            hasPermission: grant
              ? keycloakHasPermission(grant, modelClients, serviceAccount, currentUser, groupRoleProjectIds)
              : legacyHasPermission(legacyCredentials),
            keycloakGrant,
            legacyGrant,
            models: {
              UserModel: User(modelClients),
              GroupModel: Group(modelClients),
              EnvironmentModel: Environment(modelClients)
            },
            keycloakUsersGroups,
            adminScopes: { platformOwner, platformViewer },
          };

          logger.debug('WebSocket onConnect: Created context', {
            hasKeycloakGrant: !!context.keycloakGrant,
            hasLegacyGrant: !!context.legacyGrant,
            platformOwner: context.adminScopes.platformOwner,
            platformViewer: context.adminScopes.platformViewer
          });

          return context;
        } catch (err) {
          logger.error('WebSocket onConnect: Authentication error.', { error: err.message, stack: err.stack });
          throw err;
        }
      },
      onSubscribe: async (ctx, msg) => {
        logger.debug('WebSocket onSubscribe', {
          messageType: msg.type,
          operationName: msg.payload?.operationName,
          query: msg.payload?.query
        });
        return undefined;
      },
      onNext: (ctx, msg, args, result) => {
        logger.debug('WebSocket onNext', {
          messageType: msg.type,
          hasResult: !!result,
          resultData: result?.data
        });
        return result;
      },
      onError: (ctx, msg, errors) => {
        logger.error('WebSocket onError', { errors });
      },
      onDisconnect: (ctx: any, code, reason) => {
        logger.verbose('WebSocket disconnected');
      },
    },
    wsServer
  );
  logger.info(`Subscription endpoint ready at ws://localhost:${port}/graphql`);
  logger.info(`SSE subscription endpoint ready at http://localhost:${port}/graphql/stream`);

} catch (error) {
  logger.error("Failed to load GraphQL modules:", error);
  throw error;
}
  }

  await setupGraphQLModules();

  const listen = util.promisify(server.listen).bind(server);
  await listen(port);

  logger.info(`API is ready on port ${port.toString()}`);

  return server;
};
