FROM centos:centos7

# Our Images are running on OpenShift which starts containers with random (and unpredictable) userids, but a predictabble groupid (1 = root).
# The Source2Image Project has a tool `fix-permissions` which takes a folder or file as argument and changes the persmissions of all included files and folders to
# basically writeable by group, so that the user under which the docker container is running can access and write folder that it per default couldn't.
# The installing of `fix-permissions` does not change anythying itself yet, it needs to be called for each folder during a Docker build process.
RUN curl -sLo /bin/fix-permissions https://raw.githubusercontent.com/sclorg/s2i-base-container/master/core/root/usr/bin/fix-permissions && \
    chmod +x /bin/fix-permissions

# ep, or also called envplate is a tool that does enviornment variable substitution in files, instead of creating a new file with the variables substituted
# it overwrites the existing files, which is more desirable in some cases.
RUN curl -sLo /bin/ep https://github.com/kreuzwerker/envplate/releases/download/1.0.0-RC1/ep-linux && \
    chmod +x /bin/ep

# As per best practices of Docker we run services like nginx, node, php, etc directly as the PID 1 of the container. Unfortunately some services are really
# good in beeing PID 1. They for example can't handle SIGTERM signals or don't keep track of Zombie threads. Here is where `tini` comes into play.
# Tini is a super slimmed down init system that makes sure that services will work correctly and stop themselves when there is a SIGTERM signal arriving.
# It is not used by default in our Docker images, as some services like nginx are actually ok in handling beeing PID 1, so we in order to use it a Docker
# Image needs to change its entrypoing to: ENTRYPOINT ["/bin/tini", "--", "/usr/sbin/amazeeio-entrypoints"]
ENV TINI_VERSION v0.15.0
RUN curl -sLo /bin/tini  https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini && \
    chmod +x /bin/tini

# which is just good to have :)
RUN yum install -y which && \
    yum clean all

# Define a TMP dir which the container can definitely write in.
ENV TMPDIR=/tmp TMP=/tmp

# On openshift the docker container is called with a random user, so we force the HOME env variable
# to be /home but also be outside of the workdir as many scripts add stuff to the HOME directory
RUN fix-permissions /home
ENV HOME=/home

# The amazeeio entrypoint system
# This system allows to have multiple entrypoints for a container, the script `/usr/sbin/amazeeio-entrypoints` will source all scripts that exist within
# `/amazeeio/entrypoints/*`. It is defined as the standard ENTRYPOINT
# If you create a child image, consider adding your entrypoint within `/amazeeio/entrypoints/` instead of overwriting the ENTRYPOINT
COPY amazeeio-entrypoints.sh /usr/sbin/amazeeio-entrypoints
ENTRYPOINT ["/usr/sbin/amazeeio-entrypoints"]

# Allow our future random user to change /etc/passwd (needed for 10-passwd.sh)
RUN chmod g+w /etc/passwd

# We ship with a couple of default entrypoint scripts, copying them in.
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