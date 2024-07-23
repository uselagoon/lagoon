# LaravelをLagoonで実行

LaravelをLagoonで実行するには、複数の方法があります。

* 既存のアプリケーションを自分で「lagoonize」することができます（[Lagoonizing](../lagoonizing/index.md)のドキュメントを参照してください）。
* 参考として、シンプルなlagoonizeされたLaravelインストールの例示リポジトリを用意しています。
* （推奨） ["Sail:onLagoon"](../other-tools/sail.md)というツールを提供しています。これは標準的なLaravel Sailアプリケーションを取り、適切なLagoon設定ファイルを自動生成します。

## アプリケーション環境キー

アプリケーションキーを設定するには、CLIまたはUIを通じて`APP_KEY`環境変数([environment variable](../concepts-advanced/environment-variables.md))を設定してください。

これにより、キーをコード内（例えば`.env`ファイル）に保存する必要がなくなります。

アプリケーションキーを生成するには、`php artisan key:generate --show`コマンドを実行してください。このコマンドはプロジェクトファイルを変更せずに、有効なキーを出力します。
