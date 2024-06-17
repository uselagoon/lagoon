# GitLab

\*ほとんどの\*インストールでは必要ありませんが、これはLagoonとGitLabをユーザーおよびグループ認証のために統合するように設定されています。

1. 管理者権限を持つユーザーのGitLabで[パーソナルアクセストークンを作成](https://docs.gitlab.com/ee/user/profile/personal\_access\_tokens.html)します。
2. `your-gitlab.com/admin/hooks` の下にシステムフックを作成し、`webhookhandler.lagoon.example.com` にポイントし、ランダムな秘密のトークンを定義します。
   1. 「リポジトリ更新イベント」を有効にします。
3. `lagoon-core-values.yml`を更新します：

    ```yaml title="lagoon-core-values.yml"
    api:
      additionalEnvs:
        GITLAB_API_HOST: <<GitLabのURL 例： https://your-gitlab.com>>
        GITLAB_API_TOKEN: << APIへのアクセスを持つパーソナルアクセストークン >>
        GITLAB_SYSTEM_HOOK_TOKEN: << システムフック秘密トークン >>
    webhook-haondler:
      additionalEnvs:
        GITLAB_API_HOST: <<GitLabのURL 例： https://your-gitlab.com>>
        GITLAB_API_TOKEN: << APIへのアクセスを持つパーソナルアクセストークン >>
        GITLAB_SYSTEM_HOOK_TOKEN: << システムフック秘密トークン >>
    webhooks2tasks:
      additionalEnvs:
        GITLAB_API_HOST: <<GitLabのURL 例： https://your-gitlab.com>>
        GITLAB_API_TOKEN: << Personal APIへのアクセスを持つアクセストークン >>
        GITLAB_SYSTEM_HOOK_TOKEN: << システムフックシークレットトークン >>
    ```

4. `lagoon-core` helmchartをHelmで更新します。
5. すでにKeycloakにユーザーを作成している場合は、それらを削除します。
6. APIポッドで以下のコマンドを実行します：

    ```bash title="GitLabと同期"
      yarn sync:gitlab:all
    ```
