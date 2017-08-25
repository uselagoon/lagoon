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

# Allow our future random user to change /etc/passwd (needed for 10-passwd.sh)
RUN chmod g+w /etc/passwd

COPY entrypoints /amazeeio/entrypoints

# During a `docker exec <containername> bash` or `docker exec <containername> sh` the ENTRYPOINT is not executed (by design of docker)
# This means our dotenv script is never called an environment variables are not exposed, this is highly confusing for developers as
# the environment variables are avialable for the main command.
# With the next lines we make sure our dotenv script is sourced.

# When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
ENV ENV=/amazeeio/entrypoints/50-dotenv.sh

# When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
ENV BASH_ENV=/amazeeio/entrypoints/50-dotenv.sh

# When Bash is invoked as interactive it sources the file it finds in `/$HOME/.bashrc`
COPY entrypoints/50-dotenv.sh /$HOME/.bashrc