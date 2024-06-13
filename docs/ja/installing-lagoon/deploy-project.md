# プロジェクトをデプロイする

1. プロジェクトをデプロイするための以下のコマンドを実行します：

    ```bash title="デプロイ"
    lagoon deploy branch -p <あなたのプロジェクト名> -b <あなたのブランチ名>
    ```

2. LagoonのUIに移動し、プロジェクトを確認してみてください - このプロジェクトの環境が表示されているはずです！
3. クラスタ内のPodsリストを確認し、Gitリポジトリをクローンしたり、サービスをセットアップしたりするビルドPodが見えるはずです。

    ```bash title="全てのpodsを見る"
    kubectl get pods --all-namespaces | grep lagoon-build
    ```