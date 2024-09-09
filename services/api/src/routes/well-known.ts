import { Request, Response } from 'express';
import { envHasConfig, getConfigFromEnv } from '../util/config';

const wellKnown = (req: Request, res: Response) => {
  let discoverData = {
    lagoon_version: getConfigFromEnv('LAGOON_VERSION',''),
    authorization_endpoint: getConfigFromEnv('KEYCLOAK_FRONTEND_URL', ''),
    ssh_token_exchange: {
      token_endpoint_host: getConfigFromEnv('SSH_TOKEN_ENDPOINT', ''),
      token_endpoint_port: parseInt(getConfigFromEnv('SSH_TOKEN_ENDPOINT_PORT', '22'), 10)
    },
    webhook_endpoint: getConfigFromEnv('WEBHOOK_URL', ''),
    ui_url: getConfigFromEnv('UI_URL',''),
  }
  res.json(discoverData);
};

export default [wellKnown];
