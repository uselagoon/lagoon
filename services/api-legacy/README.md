# amazee.io API

The amazee.io API for the amazee.io infrastructure.

Hosted with Docker on OpenShift.

### URLs

#### develop branch:

- http://api-develop.appuio.amazeeio.review/ - uses the production hiera (https://git.vshn.net/amazee/amazee_hieradata branch master)
- http://api-develop-testhiera.appuio.amazeeio.review/ - uses the testhiera (https://github.com/amazeeio/api-test-hiera branch master)

#### master branch

- https://api.amazeeio.cloud

## Local development with Docker

As the api is hosted within Docker, we can also use Docker for development.
This means there is no need to have node, yarn or any other dependency locally installed, all you need is docker and docker-compose.

### Installation

There is nothing to install.

### Usage

Run

        docker-compose up

and this will build the Docker image (takes a bit) and start the api in development mode (`yarn run dev`).

If you like to run the server in production mode:

        docker-compose run --rm --service-ports api yarn run start

Unfortunately this does not give a lot of flexibility. So you might just open a bash to the Docker Container and run yarn commands directly:

        docker-compose run --rm --service-ports api bash

Now you are inside the Docker container and can run any commands like:

        yarn run build
        yarn run start

#### Remarks

Only the `/src` folder and `package.json`, `yarn.lock` folders are mounted from the host into the docker containers. We do that so that changes in your IDE are immediately available within the docker container and do not need a rebuild or restart of such. But we cannot mount the `node_modules` folder as some of the dependencies need to be built on the operating system directly. As the container is running centos linux and your host probably is different, we need to build them on the host directly. So if you change something with the dependencies you need to either rebuild the image via `docker-compose build api` or just connect to the container and run `yarn install` (you need to do that though every time you reconnect again, until you build a new image).

Also the `.env` file is only checked when you actually run `docker-compose build`, so the best is to just edit the `environment:` key in docker-compose.yaml, which will create real environment variables and will be also recreated every time you use `docker-compose run`

## Local Development without Docker (node and yarn installed on your machine)

### Installation

In order to run or work with this project you need to first install all Node
Packages via the Node Package Manager (NPM). Make sure that you have both, Node
and NPM installed. I highly recommend using Node Version Manager (NVM).

To install the NPM packages required for this project, run `yarn install` in the
project directory.

Additionally, you need to copy the *.env.example* file to *.env* and edit it
according to your environment.

If you are using OSX, you will probably need to install `libgcrypt` and
`openssl`  via `brew`:

```
brew install libgcrypt
brew install openssl
```

### Running the server

To run the server in development mode, simply run `yarn run dev` in the project
directory.

To run the server in production mode, you first need to build the project by
running `yarn run build`. Now, you can start the server by running `yarn run
start`.
