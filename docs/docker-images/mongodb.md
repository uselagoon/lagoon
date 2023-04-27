# MongoDB

> _MongoDB is a general purpose, document-based, distributed database built for modern application developers and for the cloud era. MongoDB is a document database, which means it stores data in JSON-like documents._
>
> * from [mongodb.com](https://www.mongodb.com/)

## Supported Versions

4.0 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mongo/4.Dockerfile) - `uselagoon/mongo-4`

This Dockerfile is intended to be used to set up a standalone MongoDB database server.

## Lagoon adaptions

This image is prepared to be used on Lagoon. There are therefore some things already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions), so this image will work with a random user, and therefore also on Kubernetes or OpenShift.
