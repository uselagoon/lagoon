# Running Harbor Locally
Lagoon supports running Harbor locally, and it is automatically used for hosting all Kubernetes-based builds (any time the project's `activeSystemsDeploy` value is set to `lagoon_kubernetesBuildDeploy`). When Harbor is ran locally, it makes use of MinIO as a storage backend, which is an AWS S3 compatible local storage solution.

# Settings
Harbor is composed of multiple containers, which all require different settings in order for them to run successfully.

## Environment Variables
The following environment variables are required to be set in order for Harbor to properly start:

* `HARBOR_REGISTRY_STORAGE_AMAZON_BUCKET`
  * This needs to be set to the name of the AWS bucket which Harbor will save images to.
  * Defaults to `harbor-images` when Lagoon is run locally or during CI testing.
* `HARBOR_REGISTRY_STORAGE_AMAZON_REGION`
  * This needs to be set to the AWS region in which Harbor's bucket is located.
  * Defaults to `us-east-1` when Lagoon is run locally or during CI testing.
* `REGISTRY_STORAGE_S3_ACCESSKEY`
  * This needs to be set to the AWS access key Harbor should use to read and write to the AWS bucket.
  * Defaults to an empty string when Lagoon is run locally or during CI testing, as MinIO does not require authentication.
* `REGISTRY_STORAGE_S3_SECRETKEY`
  * This needs to be set to the AWS secret key Harbor should use to read and write to the AWS bucket.
  * Defaults to an empty string when Lagoon is run locally or during CI testing, as MinIO does not require authentication.

The following environment variables can be set if required:

* `HARBOR_REGISTRY_STORAGE_AMAZON_ENDPOINT`
  * If this variable is set, the Harbor registry will use its value as the address of the s3 entrypoint.
  * Defaults to `https://s3.amazonaws.com` when this variable is not set.

## Container Specific Settings

The following containers make use of configuration files:

* [HarborRegistry](harbor-container-settings/harborregistry.md)
* [HarborRegistryCtl](harbor-container-settings/harborregistryctl.md)
* [Harbor-Core](harbor-container-settings/harbor-core.md)
* [Harbor-Database](harbor-container-settings/harbor-database.md)
* [Harbor-Jobservice](harbor-container-settings/harbor-jobservice.md)
* [Harbor-Trivy](harbor-container-settings/harbor-trivy.md)

The following containers do not require configuration files to run:
* Harbor-Nginx
* Harbor-Portal
* Harbor-Redis