node {

  openshift_version = 'v3.11.0'
  minishift_version = '1.34.1'
  kubernetes_versions = [
    // ["kubernetes": "v1.15", "k3s": "v0.9.1", "kubectl": "v1.15.4"],
    // ["kubernetes": "v1.16", "k3s": "v1.0.1", "kubectl": "v1.16.3"],
    ["kubernetes": "v1.17", "k3s": "v1.17.0-k3s.1", "kubectl": "v1.17.0"]
  ]

  env.MINISHIFT_HOME = "/data/jenkins/.minishift"

  withEnv(['AWS_BUCKET=jobs.amazeeio.services', 'AWS_DEFAULT_REGION=us-east-2']) {
    withCredentials([
      usernamePassword(credentialsId: 'aws-s3-lagoon', usernameVariable: 'AWS_ACCESS_KEY_ID', passwordVariable: 'AWS_SECRET_ACCESS_KEY'),
      string(credentialsId: 'SKIP_IMAGE_PUBLISH', variable: 'SKIP_IMAGE_PUBLISH')
    ]) {
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
        env.SYNC_MAKE_OUTPUT = 'none'

        stage ('env') {
          sh "env"
        }

        deleteDir()

        stage ('Checkout') {
          def checkout = checkout scm
          env.GIT_COMMIT = checkout["GIT_COMMIT"]
        }

        stage ('pull base images') {
          sh "make build:pull"
          sh "cat pull-report.json"
        }

        stage ('build images') {
          sh "make -O${SYNC_MAKE_OUTPUT} -j6 build:all"
        }

        try {
          parallel (
            '1 tests': {
              kubernetes_versions.each { kubernetes_version ->
                stage ("kubernetes ${kubernetes_version['kubernetes']} tests") {
                  try {
                    sh "make k3d/clean K3S_VERSION=${kubernetes_version['k3s']} KUBECTL_VERSION=${kubernetes_version['kubectl']}"
                    sh "make k3d K3S_VERSION=${kubernetes_version['k3s']} KUBECTL_VERSION=${kubernetes_version['kubectl']}"
                    sh "make -O${SYNC_MAKE_OUTPUT} k8s-tests"
                  } catch (e) {
                    echo "Something went wrong, trying to cleanup"
                    cleanup()
                    throw e
                  }
                }
              }
              stage ('minishift tests') {
                try {
                  sh 'make minishift/cleanall || echo'
                  sh "make minishift MINISHIFT_CPUS=16 MINISHIFT_MEMORY=32GB MINISHIFT_DISK_SIZE=50GB MINISHIFT_VERSION=${minishift_version} OPENSHIFT_VERSION=${openshift_version}"
                  sh "make -O${SYNC_MAKE_OUTPUT} push-minishift -j5"
                  sh "make -O${SYNC_MAKE_OUTPUT} openshift-tests -j7"
                } catch (e) {
                  echo "Something went wrong, trying to cleanup"
                  cleanup()
                  throw e
                }
              }
              stage ('cleanup') {
                cleanup()
              }
            },
            '2 start services': {
              stage ('start services') {
                try {
                  notifySlack()
                  sh "make kill"
                  sh "make up"
                  sh "make logs"
                } catch (e) {
                  echo "Something went wrong, trying to cleanup"
                  cleanup()
                  throw e
                }
              }
            },
            '3 push images to amazeeiolagoon': {
              stage ('push images to amazeeiolagoon/*') {
                withCredentials([string(credentialsId: 'amazeeiojenkins-dockerhub-password', variable: 'PASSWORD')]) {
                  try {
                    if (env.SKIP_IMAGE_PUBLISH != 'true') {
                      sh 'docker login -u amazeeiojenkins -p $PASSWORD'
                      sh "make -O${SYNC_MAKE_OUTPUT} -j4 publish:amazeeiolagoon-baseimages publish:amazeeiolagoon-serviceimages BRANCH_NAME=${SAFEBRANCH_NAME}"
                    } else {
                      sh 'echo "skipped because of SKIP_IMAGE_PUBLISH env variable"'
                    }
                  } catch (e) {
                    echo "Something went wrong, trying to cleanup"
                    cleanup()
                    throw e
                  }
                }
              }
            }
          )
        } catch (e) {
          echo "Something went wrong, trying to cleanup"
          cleanup()
          throw e
        }

        if (env.TAG_NAME && env.SKIP_IMAGE_PUBLISH != 'true') {
          stage ('publish-amazeeio') {
            withCredentials([string(credentialsId: 'amazeeiojenkins-dockerhub-password', variable: 'PASSWORD')]) {
              sh 'docker login -u amazeeiojenkins -p $PASSWORD'
              sh "make -O${SYNC_MAKE_OUTPUT} -j4 publish:amazeeio-baseimages"
            }
          }
        }

        if (env.BRANCH_NAME == 'master' && env.SKIP_IMAGE_PUBLISH != 'true') {
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
    sh "make minishift/cleanall"
    sh "make k3d/cleanall"
    sh "make down || true"
    sh "make kill"
    sh "make down"
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
