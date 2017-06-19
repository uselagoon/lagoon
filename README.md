# API service

## Local Development without Docker (node and yarn installed on your machine)

### Installation

In order to run or work with this project you need to first install all Node
packages via Yarn. Make sure that you have both, Node and Yarn installed. I highly
recommend using Node Version Manager (NVM).

To install the packages required for this project, run `yarn install` in the
project directory.

Additionally, you need to copy the *.env.example* file to *.env* and edit it
according to your environment.

If you are using OSX, you will probably need to install `libgcrypt` and
`openssl` via `brew`:

        brew install libgcrypt
        brew install openssl

### Running the server

To run the server in development mode, simply run `yarn run dev` in the project
directory.

To run the server in production mode, you first need to build the project by
running `yarn run build`. Now, you can start the server by running `yarn run
start`.

### Remarks

Only the `/src` folder and `package.json`, `yarn.lock` folders are mounted from
the host into the docker containers. We do that so that changes in your IDE are
immediately available within the docker container and do not need a rebuild or
restart of such. But we cannot mount the `node_modules` folder as some of the
dependencies need to be built on the operating system directly. As the container
is running centos linux and your host probably is different, we need to build
them on the host directly. So if you change something with the dependencies you
need to either rebuild the image via `docker-compose build api` or just connect
to the container and run `yarn install` (you need to do that though every time
you reconnect again, until you build a new image).

Also the `.env` file is only checked when you actually run `docker-compose build`,
so the best is to just edit the `environment:` key in docker-compose.yaml, which
will create real environment variables and will be also recreated every time you
use `docker-compose run`
