# テスト

私たちのすべてのテストは[Ansible](https://docs.ansible.com/ansible/latest/index.html)で書かれており、主に以下のアプローチに従っています:

1. 新しいGitリポジトリを作成します。
2. ファイルのリスト(`tests/files`内)から一部のファイルを追加し、このGitリポジトリにコミットします。
3. このGitリポジトリをGitサーバー(ローカルまたはGitHub上)にプッシュします。
4. トリガーサービス(例えば、実際に送信されるウェブフックと同じウェブフックハンドラーへのウェブフック)にトリガーを送信します。
5. テストが何かが起こることを期待するURLを監視を開始します(例えば、GitブランチをHTMLテキストとして持つNode.jsアプリをデプロイするなど)。
6. URLの結果と期待される結果を比較します。

Lagoonは主に3つの異なる方法でテストされています:

## 1. ローカルで

ローカル開発中にテストする最善の方法はローカルでのテストです。すべてのテストは`make`を介して開始されます。Makeは必要なすべての依存関係をダウンロードし、ビルドします。

```bash title="Make tests"
make tests
```

これにより、定義されたすべてのテストが実行されます。テストの一部だけを実行したい場合は、`make tests-list`を実行してすべての存在するテストを表示し、それぞれを個別に実行します。

たとえば、`make tests/node`はNode.js Dockerイメージのテストを実行します。

で マイクロサービスの内部で何が起こっているのかを実際に見るためには、`make logs`を使用できます:

```bash title="Make logs"
make logs
```

または特定のサービスだけを表示するには:

```bash title="Make logs"
make logs service=webhook-handler
```

## 2. 自動化された統合テスト

Lagoonに対して作成されたプルリクエストをテストするために、専用のJenkinsインスタンスで完全に自動化された統合テストを実行しています:[https://ci.lagoon.sh](https://ci.lagoon.sh)。これは`.Jenkinsfile`内で定義されており、開かれたすべてのプルリクエストに対して自動で実行されます。

これにより、すべてのイメージがビルドされ、Kubernetesクラスタが起動し、一連のテストが実行されます。

テストはここで見つけることができます:

<!-- markdown-link-check-disable -->
* [https://ci.lagoon.sh/blue/organizations/jenkins/lagoon/activity](https://ci.lagoon.sh/blue/organizations/jenkins/lagoon/activity)
<!-- markdown-link-check-enable -->
