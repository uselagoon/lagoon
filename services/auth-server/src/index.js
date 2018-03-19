// @flow

const express = require('express');
const morgan = require('morgan');
const logger = require('./logger');
const { generateRoute } = require('./routes');

import type { $Request, $Response } from 'express';

const app = express();

// Add custom configured logger (morgan through winston).
app.use(
  morgan('combined', {
    stream: {
      write: message => logger.info(message),
    },
  }),
);

const port = process.env.PORT || 3000;
const jwtSecret = process.env.JWTSECRET || '';
const issuer = process.env.JWTISSUER || 'auth.amazee.io';
const audience = process.env.JWTAUDIENCE || 'api.amazee.io';

app.post('/generate', ...generateRoute({ jwtSecret, issuer, audience }));

export interface ErrorWithStatus extends Error {
  status: number;
}

app.use((err: ErrorWithStatus, req: $Request, res: $Response) => {
  logger.error(err.toString());
  res.status(err.status || 500);
  res.send(`Request failed: ${err.toString()}`);
});

app.listen(port, () => {
  logger.debug(`Server listening on port ${port}.`);
});
