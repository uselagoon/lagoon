// @flow

import express from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import logger from './logger';
import { get, view, insert, destroy } from './util/db';
import { generateTokenFromKey } from './util/token';
import { isKeyValid } from './util/ssh';

import type { $Request, $Response } from 'express';

const app = express();
const port = process.env.PORT || 3000;
const parseJson = bodyParser.json();

// Add custom configured logger (morgan through winston).
app.use(
  morgan('combined', {
    stream: {
      write: message => logger.info(message),
    },
  }),
);

const validateKey = (req: $Request, res: $Response, next: Function) => {
  const key = (req.body && req.body.key) || '';

  if (!key) {
    return next(new Error('Missing key parameter in request body.'));
  }

  if (!isKeyValid(key)) {
    return next(new Error('Invalid key parameter in request body.'));
  }

  next();
};

app.post(
  '/login',
  parseJson,
  validateKey,
  (req: $Request, res: $Response, next: Function) => {
    const key = req.body.key;

    get(key)
      .then(doc => doc.token)
      .catch(() => {
        // The token does not exist yet. Generate a new one.
        const token = generateTokenFromKey(key);
        return insert({ key, token }, key).then(() => token);
      })
      .then(token => {
        res.send(token);
      })
      .catch(next);
  },
);

app.post(
  '/logout',
  parseJson,
  validateKey,
  (req: $Request, res: $Response, next: Function) => {
    const key = req.body.key;

    get(key)
      .then(doc => {
        destroy(doc._id, doc._rev);
      })
      .then(() => {
        res.send('Logged out successfully.');
      })
      .catch(next);
  },
);

app.get(
  '/authenticate/:token',
  (req: $Request, res: $Response, next: Function) => {
    const token = (req.params && req.params.token) || '';

    view('auth', 'by_token', { token })
      .then(body => {
        if (!body.rows.length) {
          res.status(401);
          res.send('Unauthorized.');
        } else {
          res.send(body.rows[0].key);
        }
      })
      .catch(next);
  },
);

// $FlowIgnore
app.use((err: Error, req: $Request, res: $Response, next: Function) => {
  logger.error(err.toString());

  res.status(500);
  res.send('Request failed.');
});

app.listen(port, () => {
  logger.debug(`Server listening on port ${port}.`);
});
