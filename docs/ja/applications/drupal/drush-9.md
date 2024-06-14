---
description: >-
  LagoonはデフォルトでDrush 8を使用します。Composerを使ってDrush 9をDrupalサイトにインストールすると、Drush 9が使用されます。
---

# Drush 9

## エイリアス

残念ながら、Drush 9はDrush 8が持っていたような動的なサイトエイリアスを注入する能力を提供していません。私たちはDrushチームと協力して、これを再度実装する作業を行っています。その間、Drush 9をLagoonで使用するための回避策があります。

### 基本的なアイデア

Drush 9は新しいコマンド、`drush site:alias-convert`を提供します。これはDrush 8スタイルのサイトエイリアスをDrush 9のYAMLサイトエイリアススタイルに変換できます。これにより、現在Lagoonに存在するサイトエイリアスの一時的なエクスポートが作成され、`/app/drush/sites`に保存されます。これらは、`drush sa`のようなコマンドを実行する際に使用されます。

### 準備

`drush site:alias-convert`を使用するために、以下のことを行う必要があります：

* `drush`フォルダ内の`aliases.drushrc.php`を`lagoon.aliases.drushrc.php`にリネームします。

### サイトエイリアスの生成

あなたは今、あなたのプロジェクトで以下のコマンドを実行することにより、あなたのDrushエイリアスを変換することができます。これは`cli`コンテナを使って行います：

```bash title="サイトエイリアスの生成"
docker-compose exec cli drush site:alias-convert /app/drush/sites --yes
```
 結果として得られるYAMLファイルをGitリポジトリにコミットすることは良い習慣で、これにより他の開発者がそれらを利用できます。

### サイトエイリアスの使用

Drush 9では、すべてのサイトエイリアスにはグループがプレフィックスとして付けられています。私たちの場合、これは `lagoon` です。以下のようにして、そのプレフィックス付きのすべてのサイトエイリアスを表示できます：

```bash title="すべてのサイトエイリアスを表示"
drush sa --format=list
```

そしてそれらを使用するには：

```bash title="Drush サイトエイリアスの使用"
drush @lagoon.main ssh
```

### サイトエイリアスの更新

Lagoonで新しい環境が作成された場合、サイトエイリアスファイルを更新するために `drush site:alias-convert` を実行できます。このコマンドを実行しても `lagoon.site.yml` が更新されない場合は、まず `lagoon.site.yml` を削除してから `drush site:alias-convert` を再実行してみてください。

### ローカルからリモート環境へのDrush `rsync`

ローカル環境からリモート環境にファイルを同期したい場合は、追加のパラメータを渡す必要があります：

```bash title="Drush rsync"
drush rsync @self:%files @lagoon.main:%files -- --omit-dir-times --no-perms --no-group --no-owner --chmod=ugo=rwX
```

これは、LagoonのタスクUIを使ってファイルをコピーするのではなく、一つのリモート環境から別のリモート環境に同期する場合にも適用されます。 環境。

たとえば、`@lagoon.main`から`@lagoon.dev`へのファイルの同期を行いたい場合に、ローカルで`drush rsync @lagoon.main @lagoon.dev`を実行し、追加のパラメーターなしでこれを実行すると、「2つのリモートエイリアスを指定できません」というエラーが発生する可能性があります。

これを解決するには、まず目的の環境にSSHで接続し`drush @lagoon.dev ssh`を実行し、次に上記と同様のパラメーターで`rsync`コマンドを実行します。

```bash title="Drush rsync"
drush rsync @lagoon.main:%files  @self:%files -- --omit-dir-times --no-perms --no-group --no-owner --chmod=ugo=rwX
```

リモートからローカル環境へ`rsync`する場合、これは必要ありません。

また、私たちは[Drushのメンテナと協力して](https://github.com/drush-ops/drush/issues/3491)、これを自動的に注入する方法を見つけ出そうとしています。
