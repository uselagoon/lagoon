# EFSプロビジョナー

!!!情報
    これはAWSインストールにのみ適用されます。

1. Helmリポジトリを追加します：

    ```bash title="Helmリポジトリを追加"
    helm repo add stable https://charts.helm.sh/stable
    ```

2. 設定ディレクトリに`efs-provisioner-values.yml`を作成し、値を更新します：

    ```yaml title="efs-provisioner-values.yml"
    efsProvisioner:
      efsFileSystemId: <efsFileSystemId>
      awsRegion: <awsRegion>
      path: /
      provisionerName: example.com/aws-efs
      storageClass:
        name: bulk
        isDefault: false
        reclaimPolicy: Delete
        mountOptions: []
    global:
      deployEnv: prod

    ```

3. EFSプロビジョナーをインストールします：

    ```bash title="EFSプロビジョナーをインストール"
    helm upgrade --install --create-namespace \
      --namespace efs-provisioner --wait \
      -f efs-provisioner-values.yaml \
      efs-provisioner stable/efs-provisioner
    ```