# Lagoon centos7-node6 Docker Image

## Main purpose
- Runtime image for Node.js 6 Containers

## Upstream Image
- Based on the Lagoon `centos7` image

## Installed Software/Services
- Newest stable version of Node.js 6
- Newest stable yarn version

## Additional changes & infos
- Creates an `/app` folder and changes the `WORKDIR` to this folder, it is best used when the Node.js code is copied into `/app`
- Changes `ENTRYPOINT` to use `tini` as init system, as Node.js is bad in beeing PID 1
- Does not define a `CMD`, a `CMD` should be defined by a Child Image.