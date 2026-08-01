# PHPUnitとPhpStorm

!!! Note "注意:"
    このドキュメントでは、以下を前提としています:

      - Dockerを使用している

      - [`docker-compose.yml`](../../concepts-basics/docker-compose-yml.md)ファイルを持つ標準的なAmazee/Lagoonプロジェクトを使用している

      - Macを使用している(他のOSでも動作するはずですが、フォルダ構造や設定が異なる場合があります)

## プロジェクトの設定

1. `/core/phpunit.xml.dist`ファイルを複製し、`/core/phpunit.xml`という名前で保存します。
2. `/core/phpunit.xml`を編集し、以下の変数を設定します:

   * **SIMPLETEST\_DB**: `mysql://drupal:drupal@mariadb:3306/drupal#db`
   * **SIMPLETEST\_BASE\_URL**: `<PROJECT_URL>`

## PhpStormの設定

### Dockerの設定

1. PhpStormで、**ファイル &gt; 設定 &gt; ビルド、実行、デプロイ &gt; Docker**へ移動します。
2. `+`ボタンをクリックします。
3. `Docker for Mac`を選択します。

![Dockerの設定](../../images/1-docker-setup.png)

### CLIインタープリタの設定

**新しいCLIインタープリタを追加:**

1. PhpStormで、**ファイル &gt; 設定 &gt; 言語 & フレームワーク &gt; PHP**へ移動します。
2. `...`ボタンをクリックし、 `+`ボタンをクリックします。
3. 次に、Docker、vagrantなどから新しいCLIインタープリタを追加を選択します。
4. 以下の設定を使用します:
* サーバー: `<DOCKER>`
* 設定ファイル: `./docker-compose.yml`
* サービス: `cli`
* ライフサイクル: `既存のコンテナに接続 ('docker-compose exec')`
5. パスのマッピング:
   * ローカルパス: `<ROOT_PATH>`
   * リモートパス: `/app`

![新しいCLIインタープリタの追加:](../../images/2-cli-interpreter.png)

### **リモートインタープリタの設定**

**リモートインタープリタの追加:**

1. PhpStormで、**ファイル > 設定 > 言語 & フレームワーク > PHP > テストフレームワーク**へ移動します。
2. `+`ボタンをクリックして、`PHPUnit by Remote Interpreter`を選択します。
3. 以下の設定を使用します:
   * CLIインタープリタ: `<CLI_INTERPRETER>`
   * パスマッピング: `<PROJECT_ROOT> -> /app`
   * PHPUnit: `Use Composer autoloader`
   * スクリプトへのパス: `/app/vendor/autoload.php`
   * デフォルトの設定ファイル: `/app/web/core/phpunit.xml`

![リモートインタープリタの追加](../../images/3-remote-interpreter-setup.png)

#### ランナーテンプレートの設定/構成 <a id="Drupal:PHPUnitandPhpStorm-Setup/ConfigureRunnerTemplate"></a>

1. **ランナーの設定:**
   1. PhpStormで、**実行 > 設定の編集... > テンプレート > PHPUnit**へ移動します。
   2. 以下の設定を使用します:

      1. テストスコープ: `Defined in the configuration file`

      2. インタープリター: `<CLI_INTERPRETER>`

![ランナーの設定](../../images/4-configure-runner.png)

!!! Note "注意:"
      Mac以外のOSでは手順が異なる場合があります。

## 最終チェック

### テストを実行する前に、いくつかの確認が必要です。

1. プロジェクトが起動していることを確認します:`$ docker-compose up -d`
2. プロジェクトがエラーなく動作していることを確認します (サイトにアクセスして、すべて想定通りに動作していることを確認してください)。必ずしも必要ではありませんが、正常に動作していることを確認しておくと安心です。
3. これでテストを実行する準備が整いました！

## 実行準備完了

上記の設定が完了していれば、実行したいテストに移動し、緑色の矢印をクリックするだけで簡単に実行できます！

PhpStormは、Dockerを使用してCLIコンテナに入り、設定に基づいてPHPUnitを実行します。

![これが実際の動作です、どうぞご覧ください!!](../../images/5-going-green-1-.gif)
