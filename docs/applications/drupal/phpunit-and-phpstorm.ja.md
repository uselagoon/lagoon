# PHPUnit と PhpStorm

!!! 注意
    このドキュメントでは、以下を前提としています：

      - Dockerを使用しています。

      - [`docker-compose.yml`](../../concepts-basics/docker-compose-yml.md)ファイルを含む標準的なAmazee/Lagoonプロジェクトを使用しています。

      - Macを使用しています - 他のオペレーティングシステムでも動作するはずですが、フォルダ構造や一部の設定が異なる場合があります。

## プロジェクトの設定

1. `/core/phpunit.xml.dist` ファイルを `/core/phpunit.xml` に複製します。
2. `/core/phpunit.xml` を編集し、以下の変数を入力します：

   * **SIMPLETEST\_DB**: `mysql://drupal:drupal@mariadb:3306/drupal#db`
   * **SIMPLETEST\_BASE\_URL**: `<PROJECT_URL>`

## PhpStormの設定

### Dockerの設定

1. PhpStormで、**ファイル &gt; 設定 &gt; ビルド、実行、デプロイ &gt; Docker**に移動します。
2. `+`をクリックします。
3. `Docker for Mac`を選択します。

![Dockerの設定](../../images/1-docker-setup.png)

### CLIインタープリタの設定

**新しいCLIインタープリタを追加：**

1. PhpStormで、**ファイル &gt; 設定 &gt; 言語 & フレームワーク &gt; PHP**に移動します。
2. `...`をクリックし、次に`+`をクリックします。
3. 次に、Docker、vagrantなどから新しいCLIインタープリタを追加を選択します。
4. 次の設定を使用します：
   * サーバー: `<DOCKER>` * 設定ファイル: `./docker-compose.yml`
* サービス: `cli`
* ライフサイクル: `既存のコンテナに接続 ('docker-compose exec')`
5. パスのマッピング:
   * ローカルパス: `<ROOT_PATH>`
   * リモートパス: `/app`

![新しいCLIインタープリタの追加:](../../images/2-cli-interpreter.png)

### **リモートインタープリタの設定**

**リモートインタープリタの追加:**

1. PhpStormで、**ファイル > 設定 > 言語 & フレームワーク > PHP > テストフレームワーク**に移動します。
2. `+`をクリックして、`PHPUnit by Remote Interpreter`を選択します。
3. 次の設定を使用します:
   * CLIインタープリタ: `<CLI_INTERPRETER>`
   * パスマッピング: `<PROJECT_ROOT> -> /app`
   * PHPUnit: `Use Composer autoloader`
   * スクリプトへのパス: `/app/vendor/autoload.php`
   * デフォルトの設定ファイル: `/app/web/core/phpunit.xml`

![リモートインタープリタの追加](../../images/3-remote-interpreter-setup.png)

#### ランナーテンプレートの設定/構成 <a id="Drupal:PHPUnitandPhpStorm-Setup/ConfigureRunnerTemplate"></a>

1. **ランナーの設定:**
   1. PhpStormで、**実行 > 設定の編集... > テンプレート > PHPUnit**に移動します。
   2. 次の設定を使用します:

      1. テストスコープ: `設定ファイルで定義されている`

      2. 通訳者: `<CLI_INTERPRETER>`

![ランナーの設定](../../images/4-configure-runner.png)

!!! 注意
      Macを使用していない場合、この内容は異なる場合があります。

## 最終チェック

### テストを実行する前に行う最終チェック

1. プロジェクトが起動し、稼働していること： `$ docker-compose up -d`
2. プロジェクトがエラーなく動作していること、サイトを訪れてすべてが期待通りに動作していることを確認する - これは100％必要ではありませんが、正常に動作していることを知っておくとよいでしょう。
3. テストを実行する準備が整っているはずです！

## 実行の準備完了

上記の設定を行ったら、実行したいテストに移動し、緑色の矢印を押すだけで簡単に実行できるはずです！

このボタンを押すと、PhpStormはDockerを使用してCLIコンテナに入り、設定に基づいてPHPUnitの実行を開始します。

![これが実際の動作です、どうぞご覧ください!!](../../images/5-going-green-1-.gif)