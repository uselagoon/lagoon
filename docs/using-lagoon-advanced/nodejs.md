# Node.js Graceful Shutdown

Node.js has integrated web server capabilities. Plus, with [Express](https://expressjs.com/), these can be extended even more.

Unfortunately, Node.js does not handle shutting itself down very nicely out of the box. This causes many issues with containerized systems. The biggest issue is that when a Node.js container is told to shut down, it will immediately kill all active connections, and does not allow them to stop gracefully.

This part explains how you can teach Node.js to behave like a real web server: finishing active requests and then gracefully shutting down.

As an example we use a no-frills Node.js server with Express:

```javascript
const express = require('express');
const app = express();

// Adds a 5 sec delay for all requests.
app.use((req, res, next) => setTimeout(next, 5000));

app.get('/', function (req, res) {
  res.send("Hello World");
})

const server = app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
})
```

This will just show "Hello World" in when the web server is visited at `localhost:3000`. Note the 5 second delay in the response in order to simulate a request that takes some computing time.

## Part A: Allow requests to be finished.

If we run the above example and stop the Node.js process while the request is handled \(within the 5 seconds\), we will see that the Node.js server immediately kills the connection, and our browser will show an error.

To explain to our Node.js server that it should wait for all the requests to be finished before actually stopping itself, we add the following code:

```javascript
const startGracefulShutdown = () => {
  console.log('Starting shutdown of express...');
  server.close(function () {
    console.log('Express shut down.');
  });
}

process.on('SIGTERM', startGracefulShutdown);
process.on('SIGINT', startGracefulShutdown);
```

This basically calls `server.close()`, which will instruct the Node.js HTTP server to:

1. Not accept any more requests.
2. Finish all running requests.

It will do this on `SIGINT` \(when you press `CTRL + C`\) or on `SIGTERM` \(the standard signal for a process to terminate\).

With this small addition, our Node.js will wait until all requests are finished, and then stop itself.

If we were not running Node.js in a containerized environment, we would probably want to include some additional code that actually kills the Node.js server after a couple of seconds, as it is technically possible that some requests are either taking very long or are never stopped. Because it is running in a containerized system, if the container is not stopped, Docker and Kubernetes will run a `SIGKILL` after a couple of seconds \(usually 30\) which cannot be handled by the process itself, so this is not a concern for us.

## Part B: Yarn and NPM children spawning issues

If we only implemented Part A, we would have a good experience. In the real world, many Node.js systems are built with Yarn or NPM, which provide not only package management systems to Node.js, but also script management.

With these script functionalities, we simplify the start of our application. We can see many `package.json` files that look like:

```javascript title="package.json"
{
  "name": "node",
  "version": "1.0.0",
  "main": "index.js",
  "license": "MIT",
  "dependencies": {
    "express": "^4.15.3"
  },
  "scripts": {
    "start": "node index.js"
  }
}
```

and with the defined `scripts` section we can run our application just with:

```text
yarn start
```

or

```text
npm start
```

This is nice and makes the life of developers easier. So we also end up using the same within Dockerfiles:

```text title=".dockerfile" 
CMD ["yarn", "start"]
```

Unfortunately there is a big problem with this:

If `yarn` or `npm` get a `SIGINT` or `SIGTERM` signal, they correctly forward the signal to spawned child process \(in this case `node index.js`\). However, it does not wait for the child processes to stop. Instead, `yarn`/`npm` immediately stop themselves. This signals to Docker/Kubernetes that the container is finished and Docker/Kubernetes will kill all children processes immediately. There are issues open for [Yarn](https://github.com/yarnpkg/yarn/issues/4667) and [NPM](https://github.com/npm/npm/issues/4603) but unfortunately they are not solved yet.

The solution for the problem is to not use Yarn or NPM to start your application and instead use `node` directly:

```text
CMD ["node", "index.js"]
```

This allows Node.js to properly terminate and Docker/Kubernetes will wait for Node.js to be finished.
