node {

  openshift_versions = ['v3.11.0']

  env.MINISHIFT_HOME = "/data/jenkins/.minishift"

  withEnv(['AWS_BUCKET=jobs.amazeeio.services', 'AWS_DEFAULT_REGION=us-east-2']) {
    withCredentials([usernamePassword(credentialsId: 'aws-s3-lagoon', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
      try {
        env.CI_BUILD_TAG = env.BUILD_TAG.replaceAll('%2f','').replaceAll("[^A-Za-z0-9]+", "").toLowerCase()
        env.SAFEBRANCH_NAME = env.BRANCH_NAME.replaceAll('%2f','-').replaceAll("[^A-Za-z0-9]+", "-").toLowerCase()
        env.SYNC_MAKE_OUTPUT = 'target'
        // make/tests will synchronise (buffer) output by default to avoid interspersed
        // lines from multiple jobs run in parallel. However this means that output for
        // each make target is not written until the command completes.
        //
        // See `man -P 'less +/-O' make` for more information about this option.
        //
        // Uncomment the line below to disable output synchronisation.
        //env.SYNC_MAKE_OUTPUT = 'none'

        stage ('env') {
          sh "env"
        }

        deleteDir()

        stage ('Checkout') {
          def checkout = checkout scm
          env.GIT_COMMIT = checkout["GIT_COMMIT"]
          sh "git fetch --tags"
        }

        stage ('pull base images') {
          sh "make build:pull"
          sh "cat pull-report.json"
        }

        stage ('build images') {
          sh "make -O${SYNC_MAKE_OUTPUT} -j6 build:all"
        }

        openshift_versions.each { openshift_version ->
          notifySlack()

          if (openshift_version == 'v3.11.0') {
            minishift_version = '1.34.1'
          }

          try {
            parallel (
              'start services': {
                stage ('start services') {
                  sh "make kill"
                  sh "make up"
                }
              },
              'start minishift': {
                stage ('start minishift') {
                  sh 'make minishift/cleanall || echo'
                  sh "make minishift/start MINISHIFT_CPUS=12 MINISHIFT_MEMORY=32GB MINISHIFT_DISK_SIZE=50GB MINISHIFT_VERSION=${minishift_version} OPENSHIFT_VERSION=${openshift_version}"
                }
              },
              'push images to amazeeiolagoon': {
                stage ('push images to amazeeiolagoon/*') {
                  withCredentials([string(credentialsId: 'amazeeiojenkins-dockerhub-password', variable: 'PASSWORD')]) {
                    sh 'docker login -u amazeeiojenkins -p $PASSWORD'
                    sh "make -O${SYNC_MAKE_OUTPUT} -j4 publish:amazeeiolagoon-baseimages publish:amazeeiolagoon-serviceimages BRANCH_NAME=${SAFEBRANCH_NAME}"
                  }
                }
              }
            )
          } catch (e) {
            echo "Something went wrong, trying to cleanup"
            cleanup()
            throw e
          }

          parallel (
            "_tests_${openshift_version}": {
                stage ('run tests') {
                  try {
                    sh "make -O${SYNC_MAKE_OUTPUT} -j5 build:push-minishift"
                    sh "make up"
                    sh "make -O${SYNC_MAKE_OUTPUT} -j8 tests"
                  } catch (e) {
                    echo "Something went wrong, trying to cleanup"
                    cleanup()
                    throw e
                  }
                  cleanup()
                }
            },
            "logs_${openshift_version}": {
                stage ('all') {
                  sh "make logs"
                }
            },
          )
        }

        if (env.TAG_NAME) {
          stage ('publish-amazeeio') {
            withCredentials([string(credentialsId: 'amazeeiojenkins-dockerhub-password', variable: 'PASSWORD')]) {
              sh 'docker login -u amazeeiojenkins -p $PASSWORD'
              sh "make -O${SYNC_MAKE_OUTPUT} -j4 publish:amazeeio-baseimages"
            }
          }
        }

        if (env.BRANCH_NAME == 'master') {
          stage ('save-images-s3') {
            sh "make -O${SYNC_MAKE_OUTPUT} -j8 build:s3-save"
          }
        }

      } catch (e) {
        currentBuild.result = 'FAILURE'
        throw e
      } finally {
        notifySlack(currentBuild.result)
      }
    }
  }

}

def cleanup() {
  try {
    sh "make down"
    sh "make minishift/cleanall"
  } catch (error) {
    echo "cleanup failed, ignoring this."
  }
}

def notifySlack(String buildStatus = 'STARTED') {
    // Build status of null means success.
    buildStatus = buildStatus ?: 'SUCCESS'

    def color

    if (buildStatus == 'STARTED') {
        color = '#68A1D1'
    } else if (buildStatus == 'SUCCESS') {
        color = '#BDFFC3'
    } else if (buildStatus == 'UNSTABLE') {
        color = '#FFFE89'
    } else {
        color = '#FF9FA1'
    }

    def msg = "${buildStatus}: `${env.JOB_NAME}` #${env.BUILD_NUMBER}:\n${env.BUILD_URL}"

    slackSend(color: color, message: msg)
}
