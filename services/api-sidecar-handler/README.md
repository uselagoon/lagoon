# api-sidecar-handler

This is just a simple microservice that is run as a sidecar to `api` to perform validations and generations on ssh keys used in Lagoon.

The purpose of this sidecar is to initially replace the functionality of the node `sshpk` package, as it doesn't support all types of ssh-keys that could be used.

Additionally, it can handle processes that would previously have been performed by `webhooks2tasks`