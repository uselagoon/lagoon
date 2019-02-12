ARG PYTHON_VERSION
ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/python:${PYTHON_VERSION}-cli

RUN mkdir -p /app/ckan/default \
    && fix-permissions /app/ckan/default

RUN virtualenv --no-site-packages /app/ckan/default \
    && . /app/ckan/default/bin/activate \
    && pip install setuptools==20.4
