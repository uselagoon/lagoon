node {
  def docker_compose = "docker run -t --rm -v \$WORKSPACE:\$WORKSPACE -v /var/run/docker.sock:/var/run/docker.sock -w \$WORKSPACE docker/compose:1.13.0 -f docker-compose.ci.yaml -p lagoon"


  deleteDir()

  stage ('Checkout') {
    checkout scm

    sshagent (credentials: ['api-test-hiera_deploykey']) {
      sh 'git submodule update --init'
    }

    // create a new branch 'ci-local' from the current HEAD, this is necessary as the api service searches for a branch 'ci-local'
    sh "cd hiera && git branch -f ci-local HEAD && cd .."
  }

  lock('minishift') {
    ansiColor('xterm') {
      try {
        parallel (
          'start services': {
            stage ('start services') {
              sh "${docker_compose} build --pull"
              sh "${docker_compose} up -d --force"
            }
          },
          'start openshift': {
            stage ('start openshift') {
              sh './startOpenShift.sh'
            }
          }
        )
      } catch (e) {
        echo "Something went wrong, trying to cleanup"
        cleanup(docker_compose)
        throw e
      }

        parallel (
          '_tests': {
              stage ('run tests') {
                try {
                  sh "${docker_compose} exec tests ansible-playbook /ansible/playbooks/node.yaml"
                } catch (e) {
                  echo "Something went wrong, trying to cleanup"
                  cleanup(docker_compose)
                  throw e
                }
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
