FROM jenkinsci/jenkins

# Installing the Docker Client
USER root
RUN usermod -G root -a jenkins && \
    wget -q https://get.docker.com/builds/Linux/x86_64/docker-latest.tgz -O /tmp/docker.tgz && \
    tar xfvz /tmp/docker.tgz -C /tmp/ && \
    cp /tmp/docker/docker /usr/local/bin

# We don't need a setup, we're automated
ENV JAVA_OPTS=-Djenkins.install.runSetupWizard=false\ -Xmx512m

# Installing our plugins
RUN /usr/local/bin/install-plugins.sh ansicolor blueocean rebuild greenballs openshift-pipeline pipeline-stage-view slack lockable-resources monitoring

# Setting up an Admin User
COPY adminuser.groovy /usr/share/jenkins/ref/init.groovy.d/adminuser.groovy

# Setting Executors to 0
COPY no-executors-master.groovy /usr/share/jenkins/ref/init.groovy.d/no-executors-master.groovy

# Creating the amazeeio bearer token credential
COPY github-amazeeio-bearer-token.groovy /usr/share/jenkins/ref/init.groovy.d/github-amazeeio-bearer-token.groovy
COPY vshn-gitlab-access-token.groovy /usr/share/jenkins/ref/init.groovy.d/vshn-gitlab-access-token.groovy

# Copying our slaves info
COPY nodes /usr/share/jenkins/ref/nodes

# OpenShift Sync Plugin config which disables the sync
COPY io.fabric8.jenkins.openshiftsync.GlobalPluginConfiguration.xml /usr/share/jenkins/ref/io.fabric8.jenkins.openshiftsync.GlobalPluginConfiguration.xml

ENV GIT_COMMITTER_NAME=technology@amazee.io GIT_COMMITTER_EMAIL=amazeeio-jenkins

ENV JENKINS_ADMIN_PASSWORD=fZk3bf7hsbZCQ4kYHeYkXYNitCoy6u3BbmZrm9FR
ENV JAVA_OPTS="-Djenkins.install.runSetupWizard=false -Xmx2048m"

# Changing permissions so we can run on openshift
RUN chgrp root $JENKINS_HOME
RUN chmod a+rw -R $JENKINS_HOME

COPY amazee-jenkins.sh /usr/local/bin/amazee-jenkins.sh
ENTRYPOINT ["/bin/tini", "--", "/usr/local/bin/amazee-jenkins.sh"]
