FROM centos:centos7

RUN curl -sLo /usr/local/bin/fix-permissions https://raw.githubusercontent.com/sclorg/s2i-base-container/master/core/root/usr/bin/fix-permissions && \
    chmod +x /usr/local/bin/fix-permissions

RUN curl -sLo /usr/local/bin/ep https://github.com/kreuzwerker/envplate/releases/download/1.0.0-RC1/ep-linux && \
    chmod +x /usr/local/bin/ep

RUN yum install -y which && \
    yum clean all

ENV TINI_VERSION v0.15.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini

# Define Temp Dir
ENV TMPDIR=/tmp TMP=/tmp

# On openshift the docker container is called with a random user, so we force the HOME env variable
# to be /home but also be outside of the workdir as many scripts add stuff to the HOME directory
RUN chmod g+w /home
ENV HOME=/home

COPY amazeeio-entrypoints.sh /usr/sbin/amazeeio-entrypoints
ENTRYPOINT ["/usr/sbin/amazeeio-entrypoints"]

COPY entrypoints /amazeeio/entrypoints

