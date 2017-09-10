ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/centos7

RUN yum -y install git && yum clean all

COPY ssh-key.sh /usr/sbin/ssh-key

RUN git config --global user.email "hiera-pusher@amazee.io" && git config --global user.name hiera-pusher

ENV GIT_REPO=git@local-git:/git/hiera.git

ENTRYPOINT ["/usr/sbin/ssh-key"]

COPY hiera-watch-push.sh /home/hiera-watch-push.sh

CMD ["/home/hiera-watch-push.sh"]
