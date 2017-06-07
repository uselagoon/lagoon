node {
  def docker_compose = "docker run -t --rm -v \$WORKSPACE:\$WORKSPACE -v /var/run/docker.sock:/var/run/docker.sock -w \$WORKSPACE docker/compose:1.13.0 -p lagoon"

  deleteDir()

  stage ('Checkout') {
     checkout scm
  }

  stage ('docker-compose up') {
    sshagent (credentials: ['lagoon-ci']) {
      sh "./initGit.sh"
    }
  }

  stage ('docker-compose up') {
     sh "${docker_compose} up -d"
  }

  stage ('minishift install and start') {
     sh './startOpenShift.sh'
  }

  stage ('run tests') {
     sh "${docker_compose} exec tests ansible-playbook /ansible/playbooks/node.yaml"
  }

  stage ('docker-compose down') {
     sh "${docker_compose} down -v"
  }

  stage ('docker-compose down') {
     sh "./minishift/minishift delete"
  }


}