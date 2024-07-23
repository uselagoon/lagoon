---
description: >-
  LagoonはデフォルトでDrush 8を使用します。Composerを使ってDrush 9をDrupalサイトにインストールすると、Drush 9が使用されます。
---

# Drush 9

## エイリアス

残念ながら、Drush 9では Drush 8のような動的サイトエイリアスの注入機能が提供されていません。Drushチームと協力して、この機能を再び実装できるように取り組んでいます。当面の間、Drush 9をLagoonと一緒に使用する際の回避策をご紹介します。

### 基本的な考え方

Drush 9は新しいコマンド`drush site:alias-convert`を提供しており、Drush 8 形式のサイトエイリアスを Drush 9のYAML形式のサイトエイリアスに変換することができます。このコマンドは、Lagoonに現在存在するサイトエイリアスを一度だけエクスポートし、それらを`/app/drush/sites`ディレクトリに保存します。その後、これらのエイリアスは `drush sa`のようなコマンドを実行する際に使用されます。



### 準備

`drush site:alias-convert`を使用する前に、以下の手順を行う必要があります:

* `drush`フォルダ内の`aliases.drushrc.php`を`lagoon.aliases.drushrc.php`にリネームします。

### サイトエイリアスの生成

`cli`コンテナを使用してプロジェクト内で以下のコマンドを実行すると、Drushエイリアスを変換できます:

```bash title="サイトエイリアスの生成"
docker-compose exec cli drush site:alias-convert /app/drush/sites --yes
```
生成されたYAMLファイルはGitリポジトリにコミットするのが良い習慣です。そうすることで、他の開発者も利用できるようになります。

### サイトエイリアスの使用

Drush 9では、すべてのサイトエイリアスはグループ名でプレフィックスが付けられています。今回であれば、そのグループ名はlagoonです。以下のコマンドで、プレフィックス付きのすべてのサイトエイリアスを確認できます。

```bash title="すべてのサイトエイリアスを表示"
drush sa --format=list
```

エイリアスを利用するには、次のようにします:

```bash title="Drush サイトエイリアスの使用"
drush @lagoon.main ssh
```

### サイトエイリアスの更新

Lagoonで新しい環境が作成された場合、`drush site:alias-convert`コマンドを実行して、サイトエイリアスファイル (.yml) を更新できます。このコマンドで`lagoon.site.yml`が更新されない場合は、最初に`lagoon.site.yml`を削除してから、もう一度`drush site:alias-convert`を実行してみてください。

### ローカルからリモート環境へのDrush `rsync`

ローカル環境からリモート環境にファイルを同期したい場合は、追加のパラメータを渡す必要があります:

```bash title="Drush rsync"
drush rsync @self:%files @lagoon.main:%files -- --omit-dir-times --no-perms --no-group --no-owner --chmod=ugo=rwX
```

これは、LagoonのタスクUIを使用せずに、リモート環境間でファイルを同期する場合にも当てはまります。

たとえば、`@lagoon.main`から`@lagoon.dev`へファイルを同期したい場合、上記の追加パラメータなしでローカルで`drush rsync @lagoon.main @lagoon.dev`を実行すると、"Cannot specify two remote aliases" (2 つのリモートエイリアスは指定できません) というエラーが発生する可能性があります。

これを解決するには、まず宛先の環境にSSHで接続 `drush @lagoon.dev ssh`し、上記と同様のパラメータを使用して `rsync`コマンドを実行する必要があります。

```bash title="Drush rsync"
drush rsync @lagoon.main:%files  @self:%files -- --omit-dir-times --no-perms --no-group --no-owner --chmod=ugo=rwX
```

上記の内容は、リモート環境からローカル環境へ `rsync`を使って同期する場合には必要ありません。

また、私たちは[Drushのメンテナと協力して](https://github.com/drush-ops/drush/issues/3491)、これを自動的に注入する方法を模索しています。
