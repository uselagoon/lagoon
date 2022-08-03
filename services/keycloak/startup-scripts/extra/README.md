# Extra Keycloak configuration

Any `.sh` scripts found in this directory will be executed at the end of the the `00-configure-lagoon.sh` script.
This give the opportunity to customize keycloak by, for example, placing a file in this directory via configMap (or some other mechanism).

NOTE: It should be clear that this is a potentially destructive process.
This functionality is simply provided to give administrators a hook from which to customize Keycloak.