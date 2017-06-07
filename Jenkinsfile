node {
  def docker_compose = "docker run --rm -v \$WORKSPACE:\$WORKSPACE -v /var/run/docker.sock:/var/run/docker.sock -w \$WORKSPACE docker/compose:1.13.0"

  stage ('docker-compose up') {
     sh "${docker_compose} up -d"
  }

  stage ('download minishift') {
     sh "mkdir -p minishift"
     sh "curl -L https://github.com/minishift/minishift/releases/download/v1.1.0/minishift-1.1.0-linux-amd64.tgz | tar xz -C minishift"
  }

  stage ('minishift start') {
     sh './minishift/minishift start --vm-driver virtualbox --host-only-cidr "192.168.77.1/24"'
  }

}