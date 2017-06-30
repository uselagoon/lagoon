// @flow

import express from 'express';
import morgan from 'morgan';
import logger from './logger';
import loginRoute from './routes/login';
import logoutRoute from './routes/logout';
import authenticateRoute from './routes/authenticate';

const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
  console.log('asdasdad');
  next();
});

// Add custom configured logger (morgan through winston).
app.use(
  morgan('combined', {
    stream: {
      write: message => logger.info(message),
    },
  }),
);

app.post('/login', ...loginRoute);
app.post('/logout', ...logoutRoute);
app.get('/authenticate/:token', ...authenticateRoute);

// $FlowIgnore
app.use((err: Error, req: $Request, res: $Response, next: Function) => {
  logger.error(err.toString());
  res.status(500);
  res.send(`Request failed: ${err.toString()}`);
});

app.listen(port, () => {
  logger.debug(`Server listening on port ${port}.`);
});
