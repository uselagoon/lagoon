FROM williamyeh/ansible:centos7

RUN yum -y install git && yum clean all

RUN git config --global user.email "deploytest@amazee.io" && git config --global user.name deploytest

WORKDIR /ansible
COPY . /ansible

COPY hosts /etc/ansible/hosts

ENV ANSIBLE_FORCE_COLOR=true

COPY entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]
CMD exec /bin/bash -c "trap : TERM INT; sleep infinity & wait"
