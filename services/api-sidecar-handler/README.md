# api-sidecar-handler

This is just a simple microservice that is run as a sidecar to `api` and `webhooks2tasks` to perform validations and generations on ssh keys used in Lagoon.

The purpose of this sidecar is to initially replace the functionality of the node `sshpk` package, as it doesn't support all types of ssh-keys that could be used.