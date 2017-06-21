node {
  def docker_compose = "docker run -t --rm -v \$WORKSPACE:\$WORKSPACE -v /var/run/docker.sock:/var/run/docker.sock -w \$WORKSPACE docker/compose:1.13.0 -p lagoon"


  deleteDir()

  stage ('Checkout') {
    checkout scm
  }

  lock('minishift') {
    try {
      ansiColor('xterm') {
        stage ('checkout services') {
          sshagent (credentials: ['lagoon-ci']) {
            sh "./initGit.sh"
          }
        }

        parallel (
          'start services': {
            stage ('start services') {
              sh "${docker_compose} up -d --force"
            }
          },
          'start openshift': {
            stage ('start openshift') {
              sh './startOpenShift.sh'
            }
          }
        )


        parallel (
          '_tests': {
              stage ('run tests') {
                sh "${docker_compose} exec tests ansible-playbook /ansible/playbooks/node.yaml"
                cleanup(docker_compose)
              }
          },
          'webhook-handler logs': {
              stage ('webhook-handler') {
                sh "${docker_compose} logs -f webhook-handler"
              }
          },
          'webhooks2tasks logs': {
              stage ('webhooks2tasks') {
                sh "${docker_compose} logs -f webhooks2tasks"
              }
          },
          'openshiftdeploy logs': {
              stage ('openshiftdeploy') {
                sh "${docker_compose} logs -f openshiftdeploy"
              }
          },
          'openshiftremove logs': {
              stage ('openshiftremove') {
                sh "${docker_compose} logs -f openshiftremove"
              }
          },
          'all logs': {
              stage ('all') {
                sh "${docker_compose} logs -f "
              }
          }
        )
      }
    } catch (e) {
      echo "Something went wrong, trying to cleanup"
      cleanup(docker_compose)
      throw e
    }
  }
}

def cleanup(docker_compose) {
  try {
    sh "${docker_compose} down -v"
    sh "./minishift/minishift delete"
  } catch (error) {
    echo "cleanup failed, ignoring this."
  }
}