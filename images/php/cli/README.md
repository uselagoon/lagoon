# Alpine PHP CLI Image

## Use another Node Version

By default this Image ships with the current Nodejs Version (v9 at time of writing this). If you need another Version you can remove the current version and install the one of your choice.

Add these commands as parts of your customized Dockerfile within `RUN` commands.

#### Remove current version (needed for installing any other Version)

    RUN apk del --no-cache nodejs-current yarn --repository http://dl-3.alpinelinux.org/alpine/edge/main/ --repository http://dl-3.alpinelinux.org/alpine/edge/community/

#### Install Nodejs Version 6

    RUN apk add --no-cache nodejs yarn --repository http://dl-3.alpinelinux.org/alpine/edge/community/

#### Install Nodejs Version 8

    RUN apk add --no-cache nodejs yarn --repository http://dl-3.alpinelinux.org/alpine/edge/community/ --repository http://dl-3.alpinelinux.org/alpine/edge/main/