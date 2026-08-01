# Storage Types

Lagoon currently provides options for two storage types.

{{ defaults.storage_info_link }}

## Bulk

Bulk storage in Lagoon offers the capability for `ReadWriteMany`.

Service types that support this volume type can typically be scaled, and the volumes can often be shared across multiple pods and services, as long as those services support multiple additional volumes.

Typically bulk volumes will be backed by NFS, however this can also depend on the cloud provider as there are different storage provisioners that can provision `ReadWriteMany` volumes.

{{ defaults.bulk_storage_info_link }}

## Block

Block storage in Lagoon offers the capability for `ReadWriteOnce`.

Service types that have this volume type available are not able to be scaled, this is due to the volume only be able to be written to by one pod.

Most block storage will be backed by disk, which type of disk depends on the cloud provider.

{{ defaults.block_storage_info_link }}