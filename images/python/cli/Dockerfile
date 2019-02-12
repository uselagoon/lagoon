ARG PYTHON_VERSION
ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/python:${PYTHON_VERSION}

RUN apk update \
    && apk upgrade \
    && apk add --no-cache libpq git
