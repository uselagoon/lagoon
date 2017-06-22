FROM jenkinsci/slave:latest

USER root

RUN usermod -G users -a jenkins && \
    wget -q https://get.docker.com/builds/Linux/x86_64/docker-latest.tgz -O /tmp/docker.tgz && \
    tar xfvz /tmp/docker.tgz -C /tmp/ && \
    cp /tmp/docker/docker /usr/local/bin

ENV JAVA_OPTS=-Xmx200m

USER jenkins

CMD java ${JAVA_OPTS} -jar /usr/share/jenkins/slave.jar -jnlpCredentials $JENKINS_MASTER_CREDENTIALS -jnlpUrl ${JENKINS_MASTER_URL}/computer/${JENKINS_SLAVE_NAME}/slave-agent.jnlp