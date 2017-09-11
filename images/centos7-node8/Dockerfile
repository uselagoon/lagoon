ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/centos7

MAINTAINER amazee.io hello@amazee.io

RUN \
    curl https://dl.yarnpkg.com/rpm/yarn.repo --silent -o /etc/yum.repos.d/yarn.repo && \
    curl --silent --location https://rpm.nodesource.com/setup_8.x | bash - && \
    yum install -y \
                nodejs \
                yarn-1* \
                && \
    yum clean all -y

# Prepare /app folder
RUN mkdir -p /app && \
    fix-permissions /app
WORKDIR /app

ENTRYPOINT ["tini", "--", "/usr/sbin/amazeeio-entrypoints"]