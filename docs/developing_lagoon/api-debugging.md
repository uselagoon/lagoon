!!!warning
    **Note:** This documentation relates to developing the 1.x releases of Lagoon, built from the `master` branch.
    For documentation on the current development version of Lagoon, 2.x, built from the `main` branch, please visit [docs.lagoon.sh](https://docs.lagoon.sh)

# API Debugging
How to debug Lagoon in VSCode.

1 . Ensure the `dev` script at `services/api/package.json` includes the following:

💡 _Tip: Scroll to the right to see the whole script!_

```javascript
node --inspect=0.0.0.0:9229
```

2 . Update `docker-compose.yml` to map the `dist` folder and expose the `9229` port:

```
  api:
    image: ${IMAGE_REPO:-lagoon}/api
    command: yarn run dev
    volumes:
      - ./services/api/src:/app/services/api/src
      - ./services/api/dist:/app/services/api/dist
  depends_on:
      - api-db
      - local-api-data-watcher-pusher
      - keycloak
    ports:
      - '3000:3000'
      - '9229:9229'
```

3 . Add the following to  `.vscode/launch.json`:

```javascript
{
  // Use IntelliSense to learn about possible attributes.
  // Hover to view descriptions of existing attributes.
  // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387.
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Docker: Attach to Node",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "address": "localhost",
      "outFiles": ["${workspaceRoot}/app/services/api/dist/**/*.js"],
      "localRoot": "${workspaceFolder}/services/api",
      "remoteRoot": "/app/services/api",
      "sourceMaps": true,
      "protocol": "inspector"
    }
  ]
}
```

4 . Rebuild/restart the containers:

```bash
$ rm build/api && make build/api && docker-compose restart api
```

5 . Restart VScode.
