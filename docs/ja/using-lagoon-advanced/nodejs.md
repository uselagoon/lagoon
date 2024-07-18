# Node.jsのグレースフルシャットダウン

Node.jsには統合されたウェブサーバーの機能があります。さらに[Express](https://expressjs.com/)を使用すると、これらの機能をさらに拡張することができます。

残念ながら、Node.jsはデフォルトで自身をシャットダウンする処理をあまりうまく処理しません。これはコンテナ化されたシステムで多くの問題を引き起こします。最大の問題は、Node.jsのコンテナがシャットダウンするように指示されると、すぐにすべてのアクティブな接続を強制終了し、それらを適切に停止させることができないことです。

この部分では、アクティブなリクエストを処理し終えてから、適切にシャットダウンするようにNode.jsを教える方法を説明します。

例として、Expressを使用したシンプルなNode.jsサーバーを使用します:

```javascript title="app.js"
const express = require('express');
const app = express();

// 全てのリクエストに5秒のディレイを追加。
app.use((req, res, next) => setTimeout(next, 5000));

app.get('/', function (req, res) {
  res.send("Hello World");
})

const server = app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
})
```

これは、ウェブサーバーが `localhost:3000` にアクセスされたときに "Hello World" を表示します。処理に時間がかかるリクエストをシミュレートするため、応答に5秒の遅延があることに注意してください。 いくつかのコンピューティング時間。

## パートA: リクエストの完了を許可する

上記の例を実行し、リクエストが処理されている間(5秒以内)にNode.jsプロセスを停止すると、Node.jsサーバーはすぐに接続を切断し、ブラウザはエラーを表示することになります。

Node.jsサーバーに、実際に自身を停止する前にすべてのリクエストが完了するのを待つべきだと伝えるために、以下のコードを追加します:

```javascript title="Graceful Shutdown"
const startGracefulShutdown = () => {
  console.log('Starting shutdown of express...');
  server.close(function () {
    console.log('Express shut down.');
  });
}

process.on('SIGTERM', startGracefulShutdown);
process.on('SIGINT', startGracefulShutdown);
```

これは基本的に `server.close()` を呼び出し、これによりNode.js HTTPサーバーに対して以下の指示が出されます:

1. これ以上のリクエストを受け付けない。
2. すべての実行中のリクエストを完了する。

これは `SIGINT` ( `CTRL + C` を押したとき)または `SIGTERM` (プロセスを終了するための標準信号)で行います。

この小さな追加により、Node.jsはすべてのリクエストが完了するのを待つようになり、その後自身を停止します。

もし私たちがNode.jsをコンテナ化された環境で実行していないならば、おそらく 数秒後に実際にNode.jsサーバーを終了する追加のコードを含めたいと考えています。なぜなら、一部のリクエストが非常に長くかかるか、あるいは全く停止しない可能性があるからです。これはコンテナ化されたシステム内で実行されているため、コンテナが停止しない場合、DockerとKubernetesは数秒後(通常は30秒後)に`SIGKILL`を実行します。これはプロセス自体では処理できないため、私たちにとっては関心事ではありません。

## パートB:YarnとNPMの子生成問題

もし私たちがパートAだけを実装した場合、良い経験を得られるでしょう。現実の世界では、多くのNode.jsシステムがYarnやNPMで構築されており、これらはNode.jsにパッケージ管理システムだけでなく、スクリプト管理も提供します。

これらのスクリプト機能を使うと、アプリケーションの起動を簡単にすることができます。多くの`package.json`ファイルが以下のようになっていることが分かります:

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

そして、定義された`scripts`セクションを使って、以下のようにアプリケーションを起動するだけで済みます:

```bash title="Start application"
yarn start
```

```bash title="アプリケーションの起動"
npm start
```

これは便利で、開発者の生活を楽にします。したがって、私たちはDockerfilesの中でも同じものを使用しています。

```text title=".dockerfile"
CMD ["yarn", "start"]
```

しかし、これには大きな問題があります:

`yarn` や `npm` が `SIGINT` や `SIGTERM` シグナルを受け取ると、それらは正確にシグナルを生成した子プロセスに転送します(この場合は `node index.js`)。しかし、子プロセスが停止するのを待つことはありません。代わりに、`yarn`/`npm` は即座に自分自身を停止します。これにより、Docker/Kubernetesに対してコンテナが完了したというシグナルが送られ、Docker/Kubernetesはすぐにすべての子プロセスを強制終了します。[Yarn](https://github.com/yarnpkg/yarn/issues/4667)と[NPM](https://github.com/npm/npm/issues/4603)にはオープンな問題がありますが、残念ながらまだ解決されていません。

この問題の解決策は、YarnやNPMを使用してアプリケーションを開始するのではなく、直接 `node` を使用することです。

```text title=".dockerfile"
CMD ["node", "index.js"]
```

これにより、Node.jsは適切に終了し、Docker/KubernetesはNode.jsが終了するのを待つことができます。
