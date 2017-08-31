# Lagoon centos7-node-builder:8 Docker Image

## Main purpose
- Builder image with Node.js 8.
- *Not suggested to be used as Runtime Image*

## Upstream Image
- Based on the Lagoon `centos7-node:8` image

## Installed Software/Services
- Tools required to build Node packages that need a full build system (gcc, make, git, etc.)

## Additional changes & infos
- Uses `docker-sleep.sh` as `CMD` which will cause a Container creates from this image to continue to run without doing anything.