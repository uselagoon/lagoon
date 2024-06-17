# プライベートリポジトリ

1. デプロイキーに、あなたのGitHub/GitLab/BitBucketのGitリポジトリへのアクセス権を与えます。
2. `dockerfile`に`ARG LAGOON_SSH_PRIVATE_KEY`を追加します（SSHキーが必要なビルドプロセスのステップの前に）。
3. `dockerfile`に`RUN /lagoon/entrypoints/05-ssh-key.sh`を追加します（SSHキーが必要なビルドプロセスのステップの前に）。

```bash title="プライベートリポジトリの設定"
RUN /lagoon/entrypoints/05-ssh-key.sh && composer install && rm /home/.ssh/key
```