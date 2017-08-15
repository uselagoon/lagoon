// @flow

const express = require('express');
const morgan = require('morgan');
const logger = require('./logger');
const loginRoute = require('./routes/login');
const logoutRoute = require('./routes/logout');
const authenticateRoute = require('./routes/authenticate');

const app = express();
const port = process.env.PORT || 3000;

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
app.use((err: Error, req: $Request, res: $Response) => {
  logger.error(err.toString());
  res.status(500);
  res.send(`Request failed: ${err.toString()}`);
});

app.listen(port, () => {
  logger.debug(`Server listening on port ${port}.`);
});
