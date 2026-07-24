import express from 'express';
import morgan from 'morgan';
import compression from 'compression';
import cors from 'cors';
import { json } from 'body-parser';
import { logger } from './loggers/logger';
import { createRouter } from './routes';
import { authMiddleware, RequestWithAuthData } from './authMiddleware';
import { requestMiddleware } from './requestMiddleware';
import { getApolloServer } from './apolloServer';
import { expressMiddleware } from '@as-integrations/express4';
import { getKeycloakAdminClient } from './clients/keycloak-admin';
import { sqlClientPool } from './clients/sqlClient';
import { esClient } from './clients/esClient';
import * as User from './models/user';
import * as Group from './models/group';
import * as Environment from './models/environment';
import { keycloakGrantManager } from './clients/keycloakClient';
import { keycloakHasPermission, legacyHasPermission } from './util/auth';
import { userActivityLogger } from './loggers/userActivityLogger';

export const app = express();

// Use compression (gzip) for responses.
app.use(compression());

// Automatically decode json.
app.use(json());

// Add custom configured logger (morgan through winston).
app.use(
  morgan('combined', {
    skip: (req, res) => {
      if (req.originalUrl.startsWith('/status')) {
        return req.originalUrl.startsWith('/status')
      }
      if (req.originalUrl.startsWith('/favicon.ico')) {
        return req.originalUrl.startsWith('/favicon.ico')
      }
      if (req.originalUrl.startsWith('/.well-known')) {
        return req.originalUrl.startsWith('/.well-known')
      }
    },
    stream: {
      write: message => logger.info(message.trim())
    }
  })
);

// TODO: Restrict requests to lagoon domains?
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'apollo-require-preflight']
}));

app.use(requestMiddleware);
app.use(authMiddleware);

// Add routes.
app.use('/', createRouter());

// app.use(graphqlUploadExpress());
export async function configureApp() {
  async function setupGraphQLUpload() {
    try {
      const { default: graphqlUploadExpress } = await import("graphql-upload/graphqlUploadExpress.mjs");
      app.use(graphqlUploadExpress({}) as unknown as express.RequestHandler);
    } catch (error) {
      logger.error("Failed to load or setup graphql-upload:", error);
      throw error;
    }
  }
  await setupGraphQLUpload();

  try {
    const apolloServer = await getApolloServer();
    await apolloServer.start();
    app.use('/graphql', expressMiddleware(apolloServer, {
    context: async ({ req }) => {
      // HTTP requests — authMiddleware has already run, so req has kauth/legacyCredentials
      const authReq = req as RequestWithAuthData;
      const keycloakAdminClient = await getKeycloakAdminClient();

        const modelClients = {
          sqlClientPool,
          keycloakAdminClient,
          esClient,
        };

        let currentUser: any = {};
        let serviceAccount = {};
        // if this is a user request, get the users keycloak groups too, do this one to reduce the number of times it is called elsewhere
        // legacy accounts don't do this
        let keycloakUsersGroups = []
        let groupRoleProjectIds = []
        const keycloakGrant = authReq.kauth ? authReq.kauth.grant : null
        let legacyGrant = authReq.legacyCredentials ? authReq.legacyCredentials : null
        let platformOwner = false
        let platformViewer = false
        if (keycloakGrant) {
          // get all the users keycloak groups, do this early to reduce the number of times this is called otherwise
          try {
            keycloakUsersGroups = await User.User(modelClients).getAllGroupsForUser(keycloakGrant.access_token.content.sub);
            serviceAccount = await keycloakGrantManager.obtainFromClientCredentials(undefined, undefined);
            currentUser = await User.User(modelClients).loadUserById(keycloakGrant.access_token.content.sub);
            const userRoleMapping = await keycloakAdminClient.users.listRealmRoleMappings({id: currentUser.id})
            for (const role of userRoleMapping) {
              if (role.name == "platform-owner") {
                platformOwner = true
              }
              if (role.name == "platform-viewer") {
                platformViewer = true
              }
            }
            // grab the users project ids and roles in the first request
            groupRoleProjectIds = await User.User(modelClients).getAllProjectsIdsForUser(currentUser.id, keycloakUsersGroups);
            await User.User(modelClients).userLastAccessed(currentUser);
          } catch (e) {
            logger.error('Error loading user details', e.message );
          }
        }
        if (legacyGrant) {
          const { role } = legacyGrant;
          if (role == 'admin') {
            platformOwner = true
          }
        }

        // do a permission check to see if the user is platform admin/owner, or has permission for `viewAll` on certain resources
        // this reduces the number of `viewAll` permission look ups that could potentially occur during subfield resolvers for non admin users
        // every `hasPermission` check adds a delay, and if you're a member of a group that has a lot of projects and environments, hasPermissions is costly when we perform
        // the viewAll permission check, to then error out and follow through with the standard user permission check, effectively costing 2 hasPermission calls for every request
        // this eliminates a huge number of these by making it available in the apollo context
        const hasPermission = authReq.kauth
            ? keycloakHasPermission(authReq.kauth.grant, modelClients, serviceAccount, currentUser, groupRoleProjectIds)
            : legacyHasPermission(authReq.legacyCredentials)

        return {
          keycloakAdminClient,
          sqlClientPool,
          hasPermission,
          keycloakGrant,
          legacyGrant,
          userActivityLogger: (message, meta) => {
            let defaultMeta = {
              user: authReq.kauth
                ? authReq.kauth.grant
                : authReq.legacyCredentials
                ? authReq.legacyCredentials
                : null,
              headers: req.headers
            };
            return userActivityLogger.user_action(message, {
              ...defaultMeta,
              ...meta
            });
          },
          models: {
            UserModel: User.User(modelClients),
            GroupModel: Group.Group(modelClients),
            EnvironmentModel: Environment.Environment(modelClients)
          },
          keycloakUsersGroups,
          adminScopes: {
            platformOwner: platformOwner,
            platformViewer: platformViewer,
          },
        };
      },
    }));
  } catch (error) {
    logger.error("Failed to start or apply Apollo Server middleware:", error);
    throw error;
  }

}
