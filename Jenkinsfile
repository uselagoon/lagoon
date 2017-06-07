node {
  def docker_compose = "docker run -t --rm -v \$WORKSPACE:\$WORKSPACE -v /var/run/docker.sock:/var/run/docker.sock -w \$WORKSPACE docker/compose:1.13.0 -p lagoon"

  deleteDir()

  stage ('Checkout') {
     checkout scm
  }

  try {
    stage ('docker-compose up') {
      sshagent (credentials: ['lagoon-ci']) {
        sh "./initGit.sh"
      }
    }

    stage ('docker-compose up') {
      sh "${docker_compose} up -d --force"
    }

    stage ('minishift install and start') {
      sh './startOpenShift.sh'
    }

    stage ('run tests') {
      sh "${docker_compose} exec tests ansible-playbook /ansible/playbooks/node.yaml"
    }
  } catch (e) {
    echo "Something went wrong, trying to cleanup"
    cleanup()
    throw e
  }

  cleanup()

  def cleanup() {
    try {
      sh "${docker_compose} down -v"
      sh "./minishift/minishift delete"
    } catch () {
      echo "cleanup failed, ignoring this."
    }
  }

}