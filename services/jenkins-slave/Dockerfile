FROM jenkinsci/slave:latest

USER root

RUN apt-get update && \
    apt-get -y  install \
                apt-transport-https \
                ca-certificates \
                curl \
                gnupg2 \
                software-properties-common && \
    curl -fsSL https://download.docker.com/linux/$(. /etc/os-release; echo "$ID")/gpg | apt-key add - && \
    add-apt-repository \
        "deb [arch=amd64] https://download.docker.com/linux/$(. /etc/os-release; echo "$ID") \
        $(lsb_release -cs) \
        stable" && \
    apt-get update && apt-get -y install docker-ce

ENV JAVA_OPTS=-Xmx200m

ENV JENKINS_MASTER_CREDENTIALS=admin:admin \
    JENKINS_MASTER_URL=http://jenkins:8080 \
    JENKINS_SLAVE_NAME=alpha

COPY wrapdocker.sh /wrapdocker.sh
ENTRYPOINT ["/wrapdocker.sh"]

CMD java ${JAVA_OPTS} -jar /usr/share/jenkins/slave.jar -jnlpCredentials $JENKINS_MASTER_CREDENTIALS -jnlpUrl ${JENKINS_MASTER_URL}/computer/${JENKINS_SLAVE_NAME}/slave-agent.jnlp