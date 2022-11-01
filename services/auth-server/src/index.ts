import querystring from 'querystring';
import R from 'ramda';
import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import axios from 'axios';
import { logger } from './logger';
import { validateToken } from './util/auth';
import { generateRoute } from './routes';

interface LagoonErrorWithStatus extends Error {
  status: number;
}

interface keycloakGrant {
  access_token: string,
}

const app = express();

// Add custom configured logger (morgan through winston).
app.use(
  morgan('combined', {
    stream: {
      write: message => logger.info(message.trim())
    }
  }),
);

// Only allow access with valid, admin Bearer (JWT) token
app.use(validateToken);

const defaultKeycloakUrl = R.propOr('http://keycloak:8080', 'KEYCLOAK_URL', process.env);

const port = process.env.PORT || 3000;
const lagoonKeycloakRoute = R.compose(
  R.defaultTo(defaultKeycloakUrl),
  R.find(R.test(/keycloak-/)),
  R.split(','),
  R.propOr('', 'LAGOON_ROUTES'),
)(process.env);

const getUserGrant = async (userId: string): Promise<keycloakGrant> => {
  try {
    const data = {
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      client_id: 'auth-server',
      client_secret: R.propOr(
        'no-client-secret-configured',
        'KEYCLOAK_AUTH_SERVER_CLIENT_SECRET',
        process.env,
      ),
      requested_subject: userId,
    };

    const response = await axios.post(
      `${lagoonKeycloakRoute}/auth/realms/lagoon/protocol/openid-connect/token`,
      querystring.stringify(data),
    );

    return response.data;
  } catch (err) {
    if (err.response) {
      const msg = R.pathOr('Unknown error', ['response', 'data', 'error_description'], err);
      throw new Error(`Could not get user grant: ${msg}`);
    }
  }
};

app.post('/generate', ...generateRoute(getUserGrant));

app.use((err: LagoonErrorWithStatus, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.toString());

  if (res.headersSent) {
    return next(err)
  }

  res.status(err.status || 500);
  res.send(`Request failed: ${err.toString()}`);
});

app.listen(port, () => {
  logger.debug(`Server listening on port ${port}.`);
});
