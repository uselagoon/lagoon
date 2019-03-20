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
    libmagic \
    libxslt-dev \
    libxml2-dev \
    libffi-dev \
    pcre-dev

RUN virtualenv /app/ckan/datapusher

RUN mkdir -p /app/ckan/datapusher/src \
    && mkdir -p /etc/ckan \
    && fix-permissions /app/ckan \
    && ln -s /app/ckan /usr/lib/ckan \
    && . /app/ckan/datapusher/bin/activate \
    && pip install uwsgi \
    && cd /app/ckan/datapusher/src \
    && git clone -b 0.0.14 https://github.com/ckan/datapusher.git \
    && cd datapusher \
    && /app/ckan/datapusher/bin/pip install -r requirements.txt \
    && /app/ckan/datapusher/bin/python setup.py develop \
    && cp deployment/datapusher.wsgi /etc/ckan/ \
    && cp deployment/datapusher_settings.py /etc/ckan/

CMD ["sh", "-c", ". /app/ckan/datapusher/bin/activate && uwsgi --http :8800 --wsgi-file /etc/ckan/datapusher.wsgi"]
