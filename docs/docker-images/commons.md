# Commons

The [Lagoon `commons` Docker image](https://github.com/uselagoon/lagoon-images/tree/main/images/commons). Based on [the official Alpine images](https://hub.docker.com/_/alpine/).

This image has no functionality itself, but is instead a base image, intended to be extended and utilised to build other images. All the alpine-based images in Lagoon inherit components from commons.

## Included tooling

- `docker-sleep` - standardised one-hour sleep
- `fix-permissions` - automatically fixes permissions on a given directory to all group read-write
- `wait-for` - a small script to ensure that services are up and running in the correct order - based off https://github.com/eficode/wait-for
- `entrypoint-readiness` - checks to make sure that long-running entrypoints have completed
- `entrypoints` - a script to source all entrypoints under /lagoon/entrypoints/* in an alphabetical/numerical order

## Included entrypoints

The list of default entrypoints in this image is found at https://github.com/uselagoon/lagoon-images/tree/main/images/commons/lagoon/entrypoints. Subsequent downstream images will also contribute entrypoints under /lagoon that are run in the eventual image.
