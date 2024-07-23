# ベースイメージ

## ベースイメージとは何ですか？ { #what-is-a-base-image }

ベースイメージは、Lagoon上でデプロイされたプロジェクトが使用できる、または使用している[Docker](https://www.docker.com/)イメージです。ベースイメージは、監査されていないものが上流からコードベース/プロジェクトに持ち込まれないようにする方法を提供します。また、低レベルのライブラリからアプリケーションレベルのテーマとモジュールまで、デプロイされた環境上で必要となる可能性のあるものがすべて利用可能であることを保証します。

ベースイメージは、どのシステムがデプロイされているかがわかっている場合、時間とリソースの節約に役立ちます。つまり、共有パッケージがベースイメージに含まれている場合、それらを個々の数百のサイトにデプロイする必要はありません。

## 派生イメージ { #derived-images }

派生イメージとは、ベースイメージを拡張するイメージのことを指します。例えば、いくつかのブログサイトを作る必要があるかもしれません。私たちのDrupalイメージを取得し、ブログサイトに必要なモジュールとテーマすべてを含めてカスタマイズし、そのブログイメージですべてをデプロイします。テンプレートはベースイメージから派生します。

すべての派生イメージは、`composer.json`ファイル([Packagist](https://packagist.org/)、[Satis](https://github.com/composer/satis)、または[GitHub](https://github.com/)などのリポジトリ経由で)を取り込む必要があります。これにより、基本パッケージの最新バージョンを使用するようになります。

さらに、派生イメージには、`/build/pre_composer`スクリプトへの呼び出しが含まれています。これは、ベースイメージが派生イメージでスクリプト、アップデートなどを実行するために使用できます。例えば、派生イメージでパッケージが更新またはインストールされると、デフォルトで実行され、`pre_composer`スクリプトはその後、ベースイメージパッケージを更新します。

## べースイメージの構造 { #anatomy-of-a-base-image}

!!! Info "情報"
    このドキュメントでは、DrupalやLaravelのベースイメージを例に取り上げます。これは、元々Lagoonプロジェクトでこれらのテクノロジーを使用しているクライアント向けに書かれたものです。他のベースイメージの内容もカバーするように拡張されますが、ベースイメージの内容に関係なく、プロセスは変わりません。

ベースイメージは、[Composer](https://getcomposer.org/)で管理され、[BitBucket](https://bitbucket.org/)、[GitHub](https://github.com/)、または[GitLab](https://gitlab.com/) \(チームが使用しているもの\)にホストされています。各ベースイメージには独自のリポジトリがあります。

### メタパッケージ { #metapackages }

メタパッケージは、複数の他のコンポーネントを包括するComposerパッケージです。これには、例えば、LaravelやDrupalのコアファイル、必要なモジュールやテーマなどが含まれます。 これにより、プロジェクトの依存関係に Laravel や Drupal などを含める必要がありません。

以下は、Laravelのベースイメージを `composer.json` から使用した例です:

```text title="composer.json"
"require": {
    "amazeelabs/algm_laravel_baseimage": "*"
},
```

私たちに必用なのはGitHubリポジトリを指すこのメタパッケージだけです。

### `docker-compose.yml` { #docker-composeyml }

プロジェクトの他の部分は [`docker-compose.yml`](../concepts-basics/docker-compose-yml.md) で定義されています。例えば、Drupalプロジェクトを持っている場合、Drupal のイメージが必要ですが、MariaDB、Solr、Redis、Varnishも必要です。これらのサービスのバージョンはDrupalに最適化されており、すべて`docker-compose.yml`に含まれています。

### Drupal { #drupal }

Drupalベースのイメージには、Drupalコアに加えて以下のコントリビュートツールやモジュールが含まれています:

* [Drupal Console](https://drupalconsole.com/)
* [Drush](https://www.drush.org/)
* [Configuration installer](https://www.drupal.org/project/config_installer)
* [Redis](https://www.drupal.org/project/redis)
* [Poll](https://www.drupal.org/project/poll)
* [Search API](https://www.drupal.org/project/search_api)
* [Search API Solr](https://www.drupal.org/project/search_api_solr)
* [Varnish Purge](https://www.drupal.org/project/varnish_purge)
* [Purge](https://www.drupal.org/project/purge)
* [Admin Toolbar](https://www.drupal.org/project/admin_toolbar)
* [CDN](https://www.drupal.org/project/cdn)
* [Password Policy](https://www.drupal.org/project/password_policy)
* [Pathauto](https://www.drupal.org/project/pathauto)
* [Ultimate Cron](https://www.drupal.org/project/ultimate_cron)

### Laravel { #laravel }

#### 設定 { #configuration }

ベースイメージは、Laravelで使用される環境変数のデフォルト値を提供しています。

これらは以下の値です:

* `DB_CONNECTION`
* `DB_HOST`
* `DB_PORT`
* `DB_DATABASE`
* `DB_USERNAME`
* `DB_PASSWORD`
* `REDIS_HOST`
* `REDIS_PASSWORD`
* `REDIS_PORT`

設定ファイル(通常は`/config`に位置しています)がこれらをデフォルトで使用するように確認してください。

#### キュー { #queues }

プロジェクトが[キュー](https://laravel.com/docs/5.8/queues)を使用している場合、`artisan-worker`サービスを使用できます。これはワーカーコンテナで、[`artisan queue:work`](https://laravel.com/docs/5.8/queues#running-the-queue-worker)の実行に使用されます。これはデフォルトでは無効化されています。（`docker-compose.yml`のコメントをご覧ください）

## ビルドプロセスの理解 ベースイメージ { #understanding-the-process-of-building-a-base-image }

ベースイメージを構築するプロセスにはいくつかの部分があります。主要なステップはすべてMakefileに記載されています。Jenkinsfileにはよりシンプルなビューが含まれています。これらのファイルを見ることで、このプロセス中に何が起こるかをよく理解することができます。ほとんどのステップはローカルでテストできます(これは新しいバージョンのベースイメージを構築する際に重要です)。ローカルで全てを作成し、テストした後にプッシュすると、実際のベースイメージは[Jenkins](https://jenkins.io/)によって構築され、[Harbor](../using-lagoon-advanced/using-harbor/README.md)にプッシュされます。

### Makefileとビルドの前提条件 { #makefile-and-build-assumptions }

ローカルで実行する場合、ビルドするために最低限必用な環境変数がいくつかあります。

### ベースイメージビルド変数 { #base-image-build-variables }

ベースイメージビルドプロセスに注入される変数と、それを見つける場所です。

* `BUILD_NUMBER` - これは自動的にJenkinsによって注入されます。
* `GIT_BRANCH` - これはJenkinsのビルドプロセス自体によって提供されます。その時点でビルドされているブランチ(develop、mainなど)に依存します。
* `DOCKER_REPO`/`DOCKER_HUB` - これはJenkinsfile自体内で定義されていて生成されたイメージがプッシュされるDockerプロジェクトとハブを指しています。
* `DOCKER_USERNAME`/`DOCKER_PASSWORD` - これらは、ビルドの早い段階でDockerリポジトリに実際にログインするために使用されます。これらの変数はJenkinsの認証情報内に保存されます。これらはJenkinsfile自体で使用され、Makefileの一部ではありません。つまり、Jenkins以外の場所(ローカルでテストするなど)でベースイメージをビルドする場合、`docker login`を手動で実行する必要があります。

実際には、ローカルマシンで`make`ターゲットを実行している場合、これらが環境で利用可能であることを確認したいと思うでしょう - たとえば、コマンドラインからmakeを実行するときにこれらを設定するだけでも構いません:

```bash title="ローカルでmakeターゲットを設定する"
GIT_BRANCH=example_branch_name DOCKER_HUB=the_docker_hub_the_images_are_pushed_to DOCKER_REPO=your_docker_repo_here BUILD_NUMBER=<some_integer> make images_remove
```

### Makefile targets { #makefile-targets }

最も重要なターゲットは以下の通りです:

* `images_build` : 環境変数を指定すると、画像をビルドしてタグを付けて公開します。
* `images_publish` : ビルドされた画像をDockerリポジトリにプッシュします。
* `images_start` : テストなどのためにイメージを開始します。
* `images_test`:イメージに対して基本的なテストを実行します。
* `images_remove`:ビルド環境変数が与えられると、以前にビルドされたイメージを削除します。

### ベースイメージの新リリースをビルドするワークフロー例 { #example-workflow-for-building-a-new-release-of-a-base-image }

ビルドプロセスにはいくつかのステップがあります。これらのほとんどは、様々なベースイメージ間で共有されています。これらは主に上記で説明したMakefileターゲットに対応しています。

1. **Docker Login** - Dockerのユーザー名、パスワード、HarborのURLがDockerクライアントに渡されます。
2. **Docker Build** - `make images_build`ステップが現在実行されます。これにより以下のことが行われます:
   1. すべての環境変数がビルドのために準備されていることを確認します。
   2. `docker-compose build`を実行します。これにより、現在のGitブランチからいくつかの新しいDockerイメージが生成されます。
3. **Image Test** - これにより`make images_test`ターゲットが実行されます。これはテストされるイメージにより異なります。ほとんどの場合、これはイメージを開始し、何らかの方法で対話できることを確認する非常に直感的なテストです(Drupalのインストール、ファイルのリスト表示など)。
4. **Docker Push** - このステップでは、`images_publish`のmakeターゲットに含まれるロジックが実行され、その結果として生成されたイメージにタグが付けられます。 ステップ2の**Docker Build**でそれらをHarborにプッシュします。これについては、本ガイドの[他の場所](base-images.md#step-4-building-the-new-base-images)で詳しく説明されています。
5. **Docker Clean Images** - `images_remove`というmakeターゲットを実行し、これらがHarborにあるため、新しくビルドされたイメージをDockerホストから単純に削除します。

#### ベースイメージの新バージョンのリリース { #releasing-a-new-version-of-a-base-image }

ベースイメージの新バージョンをリリースする理由は多々あります。DrupalやLaravel、Node.jsなどのイメージでは、機能やセキュリティのためにモジュールやパッケージをアップグレードまたはインストールするかもしれません。また、コンテナにバンドルされている基本ソフトウェアのバージョンを更新することもあります。例えば、PHPやNode.jsのバージョンを更新するなどです。また、ベースイメージがビルドされている実際の基本的なイメージを更新することもあります。

あなたのプロジェクトのベースとなるイメージは、Lagoonチームによって管理されているイメージです。これらのベースイメージは月に一回(またはそれ以上)の頻度で更新されます。これらが更新されたとき、あなたはアップストリームのイメージにバンドルされている変更とアップグレードを取り入れるために、自分自身のベースイメージの新バージョンをビルドする必要があります。

このセクションでは、そのプロセスを示します。 Drupal8のベースイメージの新リリースを更新およびタグ付けします。我々は新しいモジュール([ClamAV](https://www.drupal.org/project/clamav))を基に追加します。Drupalでデモを行うのは、ベースイメージの中で最も設定が複雑だからです。すべてのベースイメージに共通する手順を以下に記載します。

#### ステップ1 - ベースイメージをローカルにダウンロードする { #step-1-pull-down-the-base-image-locally }

これは単にGitリポジトリをローカルにダウンロードすることです。Drupal8のベースイメージの場合では、Bitbucketを使用しているので次のコマンドを実行します:

```bash title="Clone Git repo."
git clone ssh://git@bitbucket.biscrum.com:7999/webpro/drupal8_base_image.git
```

![基本イメージリポジトリで\`git clone\`を実行します。](../images/0.gif)

#### ステップ2 - リポジトリに変更を加える { #step-2-make-the-changes-to-the-repository }

!!! Info "情報"
    ここで示されていることはDrupal 8のベースイメージに特有のものです。しかし、あらゆる変更(ファイルの追加、基本的なDockerイメージの変更など)はすべてのベースイメージに対してこのステップで行われます。

我々の例では、ClamAVモジュールをDrupal 8のベースイメージに追加しています。これにはいくつかのステップが関与します。最初はパッケージを必要とすることで、これにより我々の`composer.json`ファイルに追加されます。これは`composer require`を実行することで行われます。

次のコマンドを実行します:
```bash title="Composer requireでパッケージをインストールする。"
composer require drupal/clamav
```

![`composer require drupal/clamav`を実行](../images/step2_require.gif)

Composer requireのプロセスが完了すると、パッケージは`composer.json`ファイルに表示されるべきです。
ここでは、`composer.json`ファイルを開き、必要なパッケージのリストを見て、ClamAVパッケージがリストされていることを確認します。

![ClamAVが必要とされていることを確認するためにcomposer.jsonを開く](../images/2.gif)

#### ステップ2.2 - テンプレートベースの派生イメージで必要なDrupalモジュールが有効になっていることを確認する { #step-22-ensure-that-the-required-drupal-module-is-enabled-in-template-based-derived-images }
ベースイメージに追加された任意のモジュールは、テンプレートベースの派生イメージで有効にする必要があります。これは、モジュールをLagoon Bundleモジュールに追加することで行われます。これは具体的には、`dependencies`セクションの`lagoon_bundle.info.yml`ファイルに依存性として追加することを要求します。Lagoon Bundleモジュールは、派生イメージ間の依存関係を強制するためだけに存在するユーティリティモジュールです。
ここでは、`web/modules/contrib/lagoon/lagoon_bundle/lagoon_bundle.info.yml`を開き、依存関係として`clamav:clamav`を追加します。

![Lagoon Bundleの依存関係としてClamAVを追加する。](../images/3.png)

これに依存関係を追加することで、派生したイメージ上でLagoon Bundleモジュールが有効になるたびに、その依存関係(この場合、新たに追加されたClamAVモジュール)も有効になります。これは、ロールアウト時に`lagoon_bundle`を派生イメージで有効にするポストロールアウトスクリプトで強制されます。
#### ステップ2.3 - テスト { #step-23-test }
これはあなたが何をテストしているかによります。ClamAVモジュールを追加する場合、ベースイメージでモジュールがダウンロードされ、Lagoon Bundleモジュールが有効化されたときにClamAVも有効化されることを確認したいです。
ここでは、モジュールが`/app/web/modules/contrib`にダウンロードされたことを確認します。

![/app/web/modules/contribをチェックして、ClamAVがダウンロードされていることを確認する。 ](../images/4.gif)

そして、`lagoon_bundle`モジュールを有効化するときに、`clamav`も有効化されることを確認するために、以下のコマンドを実行します。
```bash title="Drushでモジュールを有効化する。"
drush pm-enable lagoon_bundle -y
```

![`drush pm-enable lagoon_bundle -y`を実行し、それがClamAVも有効化することを確認する](../images/5.gif)

!!! Warning "警告"
    上記のコンテナでJWTエラーが発生していることが分かるでしょう。上のデモではこのエラーは無視してかまいません。背景として、あなたが作業しているサイトにLagoon環境が存在しない場合、このエラーが表示されます。

テストが終了したので、イメージをタグ付けしてビルドすることができます。

#### ステップ3 - イメージのタグ付け { #step-3-tagging-images }

イメージは、[Gitタグ](https://git-scm.com/docs/git-tag)に基づいてバージョン管理されます - これらは標準的な[セマンティックバージョニング](https://semver.org/)(semver)のプラクティスに従うべきです。すべてのタグは **vX.Y.Z** の構造を持つべきであり、X、Y、Zは整数です(正確にはX.Y.Z自体がセマンティックバージョンであり、vX.Y.Zはタグです)。これはイメージタグを決定するために使用されるので必ず従う必要があります。

この例では、ClamAVを追加したことを示すDrupal8のベースイメージの新しいバージョンをタグ付けします。

#### ここでは、イメージのタグ付け方法を示します { #here-we-demonstrate-how-to-tag-an-image }

私たちは、`git log`を使用して、通常のコミットやプッシュと同じように、変更をコミット(しかしプッシュはしない)したことを確認します。

1. まだ変更をコミットしていなければ、コミットします。
2. 次に、`git tag`を使用して、どのタグにいるのかを確認します。
3. 次に、`git tag -a v0.0.9 -m “Adds clamAV to base.”`を使用してタグ付けします。
   1. _git -a, --annotateを使うと  無署名の注釈付きタグオブジェクトを作成します。
4. 次に、`git push --tags`でタグをプッシュします。
5. 最後に、`git push`で全ての変更をプッシュします。

!!! Danger "危険"
    タグはそれ自体のステップで明示的にプッシュしなければなりません！

![ベースイメージをタグ付けしてプッシュする方法を示す](../images/6.gif)

#### Gitのタグがイメージのタグにどのようにマッピングされるか { #how-git-tags-map-to-image-tags }

!!! Danger "危険"
    ビルドワークフローによりますが、ほぼ確実に**develop**ブランチ経由で変更をプッシュし、それを**main**ブランチにマージするでしょう。

ここで覚えておくべき重要な点は、Jenkinsのベースイメージのビルドプロセスは、最新のコミットタグに基づいてイメージをタグ付けするということです。

イメージは以下のルールでタグ付けされ、これに該当するものごとにイメージがビルドされます:

1. **main**ブランチがビルドされると、`latest`としてタグ付けされます。
2. developブランチがビルドされると、`development`としてタグ付けされます。
3. ビルドされるコミットがタグ付けされていれば、そのブランチはそのコミットのタグ付けでビルドされます。
   1. 上で示したように、これが新しいバージョンをリリースする方法です。また、任意のタグでアドホックなビルドを行うためにも使用できます。タグ名には十分注意してください。これらはセマンティックバージョニングのタグでのみテストされています。

#### ステップ4 - 新しいベースイメージのビルド { #step-4-building-the-new-base-images }

!!! Info "情報"
    一般的には、自動ビルドのためのトリガーストラテジーをここに設定することになりますが、それはあなたのニーズや設定によって異なるため、ここでは手動でビルドする方法を説明します。

1. あなたのLagoon Jenkinsインスタンスにアクセスします。
2. 作業中のプロジェクト(この場合、AIOBI Drupal 8 Base)を選択します。
3. ビルドしたいブランチをクリックします。
4. 「Build Now」をクリックします。

![Jenkins UIでベースイメージをビルドする方法を示す](../images/7.gif)

これにより、ビルドプロセスが開始され、成功すれば新しいイメージをHarborにプッシュします。

ビルドが成功しない場合は、ビルド自体をクリックしてログを読み、どこで失敗したかを理解することができます。

下のHarborからのスクリーンショットで示されているように、私たちがJenkinsでビルドしたばかりのイメージはHarborにアップロードされ、タグ付けされています。ここでは、それがv0.0.9とタグ付けされているため、そのタグのついたイメージが存在します。また、私たちは**main**ブランチをビルドしたので、「latest」イメージもビルドされました。この段階では、v0.0.9と「latest」イメージは同一です。

![アップロードされ、タグ付けされたイメージを示すHarborからのスクリーンショット](../images/8.png)

## 謝辞 { #acknowledgement }

ベースイメージの構造は、実際には、 [Denpal](https://github.com/dennisarslan/denpal)のフォークです。これは元の[Drupal Composer Template](https://github.com/drupal-composer/drupal-project)に基づいていますが、Lagoon(ローカル開発環境またはホストされたLagoon)で実行するために必要なすべてを含んでいます。
