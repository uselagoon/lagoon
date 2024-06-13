# 環境の種類

Lagoonは現在、`production（本番環境）`と`development（開発環境）`の2つの異なる環境タイプを区別しています。

Lagoon GraphQL APIを通じてプロジェクトを設定する際には、`productionEnvironment`を定義することができます。Lagoonが実行するすべてのデプロイメントで、現在の環境名が`productionEnvironment`で定義されているものと一致するかどうかをチェックします。もしそうであれば、Lagoonはこの環境を`production`環境としてマークします。これは2つの場所で行われます：

1. GraphQL API自体内で。
2. すべてのコンテナ内で`LAGOON_ENVIRONMENT_TYPE`という名前の環境変数として。

しかしそれだけです。Lagoon自体は`development`と`production`の環境をまったく同じように扱います（最終的には環境の違いをできるだけ少なくすることが目指しています - それがLagoonの美しさです）。

この情報を使用するものがいくつかあります：

* デフォルトでは、`development`環境はヒットが4時間ない場合に休止状態になります（心配しないでください、自動的に起動します）。また、Lagoonの管理者に一つずつの環境で自動休止を無効にするよう依頼することも可能です！
* デフォルトのDrupal `settings.php`ファイルは、`development.settings.php`と `production.settings.php`は、環境タイプごとに異なる設定や構成を定義できます。
* もし、プロダクション環境として定義された環境（ウェブフックまたはREST経由で）を削除しようとすると、Lagoonはあなたが誤って削除するのを防ぐために、礼儀正しく削除を拒否します。プロダクション環境を削除するためには、APIで`productionEnvironment`を変更するか、REST APIのPOSTペイロードで秘密の`forceDeleteProductionEnvironment: true`を使用できます。
* Lagoonの管理者は、プロダクション環境情報を追加の事項に使用することがあります。例えば、amazee.ioでは、ホスティングの価格を計算するために、プロダクション環境のヒット数だけを計算しています。