# Bulk Storage Provisioner


## AWS-specific instructions
!!! Info
    The EFS info here is only applicable to AWS installations, but the basic process should be similar for all NFS volumes.

In order to create the necessary `Bulk` StorageClass, you will need to have an RWX-capable storage backend.

In this example, we will provide documentation to configure EFS as a NFS server, and configure that for use with Lagoon

### Requirements
1. Provision and configure an EFS, taking note of any security group requirements (https://docs.aws.amazon.com/efs/latest/ug/mounting-fs-mount-cmd-dns-name.html)
2. The DNS name for the mount target of the EFS volume - usually `file-system-id.efs.aws-region.amazonaws.com`
3. Familiarity with the NFS CSI driver for Kubernetes - https://github.com/kubernetes-csi/csi-driver-nfs

### Steps

1. Add Helm repository for the NFS CSI driver
    ```bash title="Add Helm repo"
    helm repo add csi-driver-nfs https://raw.githubusercontent.com/kubernetes-csi/csi-driver-nfs/master/charts
    ```
2. Configure the `bulk` StorageClass EFS NFS mount target in a values file. Note that this step also installs a secret into the namespace to handle deleting volumes, as per [here](https://github.com/kubernetes-csi/csi-driver-nfs/issues/260)

    ```yaml title="csi-driver-nfs-storageclass.yaml" hl_lines="7"
    apiVersion: storage.k8s.io/v1
    kind: StorageClass
    metadata:
      name: bulk
    provisioner: nfs.csi.k8s.io
    parameters:
      server: file-system-id.efs.aws-region.amazonaws.com
      share: /
      csi.storage.k8s.io/provisioner-secret-name: "mount-options"
      csi.storage.k8s.io/provisioner-secret-namespace: "csi-driver-nfs"
    reclaimPolicy: Delete
    volumeBindingMode: Immediate
    mountOptions:
      - nfsvers=4.1
      - rsize=1048576
      - wsize=1048576
      - hard
      - timeo=600
      - retrans=2
      - noresvport
    ---
    apiVersion: v1
    kind: Secret
    metadata:
      name: mount-options
      namespace: csi-driver-nfs
    stringData:
      mountOptions: "nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport"
    ```
3. Install the NFS CSI driver
    ```bash title="Install NFS CSI Driver"
    helm upgrade --install --create-namespace \
      --namespace csi-driver-nfs --wait \
      csi-driver-nfs csi-driver-nfs/csi-driver-nfs
    ```
4. Install the StorageClass and secret
    ```bash title="Install bulk StorageClass and Secret"
    kubectl apply -f csi-driver-nfs-storageclass.yaml
    ```
