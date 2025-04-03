import http from 'http';
import util from 'util';
import { logger } from './loggers/logger';
import { toNumber } from './util/func';
import { getConfigFromEnv } from './util/config';
import { app } from './app';
import { execute, subscribe } from "graphql";


export const createServer = async () => {
  logger.verbose('Starting the api...');

  const port = toNumber(getConfigFromEnv('PORT', '3000'));
  const server = http.createServer(app);
  server.setTimeout(900000); // higher Server timeout: 15min instead of default 2min

  // apolloServer.installSubscriptionHandlers(server);

  async function setupGraphQLModules() {
    try {
      const { useServer } = require('graphql-ws/dist/use/ws').default;

      const { loadSchemaSync } = require("@graphql-tools/load").default;

      const { GraphQLFileLoader } = require("@graphql-tools/graphql-file-loader").default;

      const WebSocket = (await import("ws")).default;

      const schema = loadSchemaSync(
        "/home/chris/lagoon/services/workflows/internal/lagoonclient/schema.graphql",
        { loaders: [new GraphQLFileLoader()] }
      );

      const wsServer = new WebSocket.Server({
        server,
        path: "/graphql",
      });

      useServer({ schema, execute, subscribe }, wsServer);

    } catch (error) {
      console.error("Failed to load GraphQL modules:", error);
    }
  }

  setupGraphQLModules();


  const listen = util.promisify(server.listen).bind(server);
  await listen(port);

  logger.info(`API is ready on port ${port.toString()}`);

  return server;
};
