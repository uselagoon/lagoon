node {

  // MINISHIFT_HOME will be used by minishift to define where to put the docker machines
  // We want them all in a unified place to be able to know how many machines there are, etc. So we put them in the
  // Jenkins HOME Folder
  env.MINISHIFT_HOME = "${env.JENKINS_HOME}/.minishift"

  withEnv(['AWS_BUCKET=jobs.amazeeio.services', 'AWS_DEFAULT_REGION=us-east-2']) {
    withCredentials([usernamePassword(credentialsId: 'aws-s3-lagoon', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
      try {
        env.CI_BUILD_TAG = env.BUILD_TAG.replaceAll('%2f','').replaceAll("[^A-Za-z0-9]+", "").toLowerCase()
        env.SAFEBRANCH_NAME = env.BRANCH_NAME.replaceAll('%2f','-').replaceAll("[^A-Za-z0-9]+", "-").toLowerCase()

        deleteDir()

        stage ('Checkout') {
          def checkout = checkout scm
          env.GIT_COMMIT = checkout["GIT_COMMIT"]
          sh "git fetch --tags"
        }

        stage ('build images') {
          sh "make build"
        }

        stage ('push images to amazeeiolagoon/*') {
          withCredentials([string(credentialsId: 'amazeeiojenkins-dockerhub-password', variable: 'PASSWORD')]) {
            sh 'docker login -u amazeeiojenkins -p $PASSWORD'
            sh "make publish-amazeeiolagoon-baseimages publish-amazeeiolagoon-serviceimages BRANCH_NAME=${SAFEBRANCH_NAME} -j4"
          }
        }

        lock('minishift') {
          notifySlack()

          try {
            parallel (
              'start services': {
                stage ('start services') {
                  sh "make kill"
                  sh "make up"
                  sh "sleep 60"
                }
              },
              'start minishift': {
                stage ('start minishift') {
                  sh 'make minishift MINISHIFT_CPUS=8 MINISHIFT_MEMORY=12GB MINISHIFT_DISK_SIZE=50GB'
                }
              }
            )
          } catch (e) {
            echo "Something went wrong, trying to cleanup"
            cleanup()
            throw e
          }

          parallel (
            '_tests': {
                stage ('run tests') {
                  try {
                    sh "make push-minishift"
                    sh "make tests -j2"
                  } catch (e) {
                    echo "Something went wrong, trying to cleanup"
                    cleanup()
                    throw e
                  }
                  cleanup()
                }
            },
            'logs': {
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
              sh "make publish-amazeeio-baseimages -j4"
            }
          }
        }

        if (env.BRANCH_NAME == 'master') {
          stage ('save-images-s3') {
            sh "make s3-save -j8"
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
    sh "make minishift/clean"
    sh "make clean"
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
