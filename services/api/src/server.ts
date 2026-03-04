import http from 'http';
import util from 'util';
import { AuthenticationError } from 'apollo-server-express';
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

const { useServer } = require('graphql-ws/lib/use/ws');
const { createHandler } = require('graphql-sse/lib/use/http');

/**
 * Extract a bearer token from graphql-ws connectionParams.
 * The lagoon-beta-ui sends the token in different shapes depending on whether
 * the connection is made server-side (apolloClient.ts) or client-side
 * (apollo-client-components.tsx):
 *
 *   Server-side:  { Authorization: "Bearer <token>" }             (top-level)
 *   Client-side:  { headers: { authorization: "Bearer <token>" } } (nested)
 *
 * We also keep backward-compat for `authToken` (plain token, no Bearer prefix).
 */
function extractWsToken(connectionParams: Record<string, any> | null | undefined): string | null {
  const p = connectionParams || {};
  const stripBearer = (v: string) => v.replace(/^bearer\s+/i, '').trim();

  if (p.authToken) return p.authToken;
  if (p.Authorization) return stripBearer(p.Authorization);
  if (p.authorization) return stripBearer(p.authorization);
  if (p.headers?.Authorization) return stripBearer(p.headers.Authorization);
  if (p.headers?.authorization) return stripBearer(p.headers.authorization);
  return null;
}

export const createServer = async () => {
  logger.verbose('Starting the api...');

  await configureApp();

  const port = toNumber(getConfigFromEnv('PORT', '3000'));

  const schema = await getSchema();

  const sseHandler = createHandler({
    schema,
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
    context: async (req, _params) => {
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
          throw new AuthenticationError('Failed to load user context for SSE subscription');
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
        platformViewer,
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
          EnvironmentModel: Environment(modelClients),
        },
        keycloakUsersGroups,
        adminScopes: { platformOwner, platformViewer },
      };
    },
    onSubscribe: async (req, params) => {
      logger.debug('SSE onSubscribe', {
        operationName: params?.operationName,
        query: params?.query,
        variables: params?.variables,
      });
    },
    onNext: (req, params, result) => {
      logger.debug('SSE onNext', {
        hasResult: !!result,
        resultData: result?.data,
        errors: result?.errors,
      });
    },
    onError: (req, params, errors) => {
      logger.error('SSE onError', {
        errors,
        params,
      });
    },
    onComplete: (req, params) => {
      logger.verbose('SSE connection completed', { params });
    },
  });

  const server = http.createServer(async (req, res) => {
    if (req.url?.startsWith('/graphql/stream')) {
      const origin = process.env.CORS_ORIGIN || '*';
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apollo-require-preflight');
      try {
        await sseHandler(req, res);
      } catch (error: any) {
        logger.error('SSE handler error', {
          error: error.message,
          stack: error.stack,
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
      const WebSocket = (await import('ws')).default;
      const schema = await getSchema();

      const wsServer = new WebSocket.Server({
        server,
        path: '/graphql',
      });

      useServer(
        {
          schema,
          context: async (ctx) => {
            const token = extractWsToken(ctx.connectionParams);
            let keycloakGrant = null;
            let legacyGrant = null;

            try {
              if (token) {
                const { grant, legacyCredentials } = await getGrantOrLegacyCredsFromToken(token);
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
                throw new AuthenticationError('Failed to load user context for subscription');
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
                : () => Promise.reject(new Error('Unauthorized'));

            return {
              keycloakAdminClient,
              sqlClientPool,
              hasPermission,
              keycloakGrant,
              legacyGrant,
              models: {
                UserModel: User(modelClients),
                GroupModel: Group(modelClients),
                EnvironmentModel: Environment(modelClients),
              },
              keycloakUsersGroups,
              adminScopes: { platformOwner, platformViewer },
            };
          },
          onConnect: async (ctx) => {
            const token = extractWsToken(ctx.connectionParams);
            if (!token) {
              logger.debug('WebSocket onConnect: No auth token in connection params; auth will be checked per-operation.');
            }
            return true;
          },
          onSubscribe: async (ctx, msg) => {
            logger.debug('WebSocket onSubscribe', {
              messageType: msg.type,
              operationName: msg.payload?.operationName,
              query: msg.payload?.query,
            });
            return undefined;
          },
          onNext: (ctx, msg, args, result) => {
            logger.debug('WebSocket onNext', {
              messageType: msg.type,
              hasResult: !!result,
              resultData: result?.data,
            });
            return result;
          },
          onError: (ctx, msg, errors) => {
            logger.error('WebSocket onError', { errors });
          },
          onDisconnect: (_ctx: any, _code, _reason) => {
            logger.verbose('WebSocket disconnected');
          },
        },
        wsServer,
      );
      logger.info(`Subscription endpoint ready at ws://localhost:${port}/graphql`);
      logger.info(`SSE subscription endpoint ready at http://localhost:${port}/graphql/stream`);
    } catch (error) {
      logger.error('Failed to load GraphQL modules:', error);
      throw error;
    }
  }

  await setupGraphQLModules();

  const listen = util.promisify(server.listen).bind(server);
  await listen(port);

  logger.info(`API is ready on port ${port.toString()}`);

  return server;
};
