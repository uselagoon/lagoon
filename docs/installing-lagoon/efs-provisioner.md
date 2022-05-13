# EFS Provisioner

!!! Note "Note:"
    This is only applicable to AWS installations.

1. Add Helm repository: `helm repo add stable https://charts.helm.sh/stable`
2. Create `efs-provisioner-values.yml` in your config directory and update the values:
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

3. Install EFS Provisioner:`helm upgrade --install --create-namespace --namespace efs-provisioner -f efs-provisioner-values.yaml  efs-provisioner stable/efs-provisioner`