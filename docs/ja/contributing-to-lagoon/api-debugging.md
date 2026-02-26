# APIデバッグ

1 . `services/api/package.json`にある`dev`スクリプトが以下を含むことを確認します:

```javascript title="services/api/package.json"
node --inspect=0.0.0.0:9229
```

2 . `docker-compose.yml`を更新して、`dist`フォルダをマップし、`9229`ポートを公開します:

```yaml title="docker-compose.yml"
  api:
    image: ${IMAGE_REPO:-lagoon}/api
    command: pnpm run dev
    volumes:
      - ./services/api/src:/app/src
      - ./services/api/dist:/app/dist
  depends_on:
      - api-db
      - local-api-data-watcher-pusher
      - keycloak
    ports:
      - '3000:3000'
      - '9229:9229'
```

3 . 次の内容を`.vscode/launch.json`に追加します:

```javascript title=".vscode/launch.json"
{
  // IntelliSenseを使用して可能な属性について学習します。
  // 既存の属性の説明を表示するには、ホバーします。
  // 詳細情報は、次のURLを参照してください:https://go.microsoft.com/fwlink/?linkid=830387.
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Docker: Attach to Node",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "address": "localhost",
      "outFiles": ["${workspaceRoot}/services/api/dist/**/*.js"],
      "localRoot": "${workspaceFolder}/services/api",
      "remoteRoot": "/app",
      "sourceMaps": true,
      "protocol": "inspector"
    }
  ]
}

4 . コンテナの再構築/再起動:

```bash title="コンテナの再起動"
rm build/api && make build/api && docker-compose restart api
```

5 . VScodeを再起動します。
