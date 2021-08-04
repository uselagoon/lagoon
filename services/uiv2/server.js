const express = require('express');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const port = dev ? 3003 : 3000;
const app = next({
  dev,
  dir: 'src'
});
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = express();

    // Handle favicon requests that ignore our HTML meta tags.
    server.get('/favicon.ico', (req, res) =>
      res
        .status(200)
        .sendFile('favicon.ico', {
          root: __dirname + '/src/static/images/favicons/'
        })
    );

    server.get('*', (req, res) => {
      return handle(req, res);
    });

    server.listen(port, err => {
      if (err) throw err;
      console.log('> Ready on http://localhost:' + port);
    });
  })
  .catch(ex => {
    console.error(ex.stack);
    process.exit(1);
  });
