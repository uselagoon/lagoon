# MongoDB Image

Lagoon `MongoDB` image Dockerfile, based on offical package `mongodb` provided by the `alpine:3.8` image.

This Dockerfile is intended to be used to setup a standalone MongoDB database server.

## Lagoon & OpenShift adaptions

This image is prepared to be used on Lagoon which leverages OpenShift.  
There are therefore some things already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/sclorg/s2i-base-container/blob/master/core/root/usr/bin/fix-permissions) so this image will work with a random user and therefore also on OpenShift.

