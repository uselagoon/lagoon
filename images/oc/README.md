# OpenShift client tools Docker image

## Main purpose
- Provide the `oc` command inside a docker container so the command does not need to be installed on a computer

## Upstream Image
- Based on the Lagoon `frolvlad/alpine-glibc` image, which brings alpine with glibc support

## Installed Software/Services
- OpenShift Client tools (`oc`)
- ep (envplate) for environment variable substitution during entrypoint

## Additional changes & infos
- Expects the OpenShift Console to connect to as `OPENSHIFT_CONSOLE` variable
- Either needs an `OPENSHIFT_TOKEN` passed as env variable to be used to connect to the OpenShift console
- Or needs `OPENSHIFT_USERNAME` & `OPENSHIFT_PASSWORD` passed, which is then ran with `oc login` during entrypoint to login and generate a token and expose it as `OPENSHIFT_TOKEN` env variable