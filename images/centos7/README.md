# Lagoon centos7 Docker Image

This image is the base for all other Docker images within Lagoon. It has the upstream of `centos:centos7`.

It probably will never ran directly itself, but instead be used as the upstream Image for other Docker Images.

Check the `Dockerfile` to learn what and why they are installed.

## Entrypoint system

In an hierarchical Docker Image system we sometimes like to have multiple entrypoints. This image has such a system.

Instead of running a single entrypoint script, it sources all scripts that it can find within `/amazeeio/entrypoints/*`.

If you create a child image from this image, consider adding your entrypoint within `/amazeeio/entrypoints/` instead of overwriting the ENTRYPOINT

## dotenv system

Like many other languages (nodejs for example), this Image supports env variable creation via `.env` files, with the possibility to create .env files only for some branches. Check the `50-dotenv.sh` file to learn more about it.