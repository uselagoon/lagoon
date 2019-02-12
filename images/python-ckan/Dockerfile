ARG PYTHON_VERSION
ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/python:${PYTHON_VERSION}

RUN apk update \
    && apk upgrade \
    && apk add --no-cache git \
    libpq \
    postgresql-dev \
    gcc \
    musl-dev \
    libmagic

RUN mkdir -p /app/ckan/default \
    && fix-permissions /app/ckan/default

RUN virtualenv --no-site-packages /app/ckan/default \
    && . /app/ckan/default/bin/activate \
    && pip install setuptools==20.4
