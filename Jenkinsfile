def skipRemainingStages = false

pipeline {
  agent { label 'lagoon' }
  environment {
    // configure build params
    SAFEBRANCH_NAME = env.BRANCH_NAME.replaceAll('%2F','-').replaceAll('[^A-Za-z0-9]+', '-').toLowerCase()
    SAFEBRANCH_AND_BUILDNUMBER = (env.SAFEBRANCH_NAME+env.BUILD_NUMBER).replaceAll('%2f','').replaceAll('[^A-Za-z0-9]+', '').toLowerCase();
    CI_BUILD_TAG = 'lagoon'.concat(env.SAFEBRANCH_AND_BUILDNUMBER.drop(env.SAFEBRANCH_AND_BUILDNUMBER.length()-26));
    NPROC = "${sh(script:'getconf _NPROCESSORS_ONLN', returnStdout: true).trim()}"
    SKIP_IMAGE_PUBLISH = credentials('SKIP_IMAGE_PUBLISH')
  }

  stages {
    stage ('notify started') {
      steps {
        notifySlack('STARTED')
      }
    }
    stage ('env') {
      steps {
        sh 'env'
      }
    }
    stage ('skip on docs commit') {
      when {
        anyOf {
          changeRequest branch: 'docs\\/.*', comparator: 'REGEXP'
          branch pattern: "docs\\/.*", comparator: "REGEXP"
        }
      }
      steps {
        script {
          skipRemainingStages = true
          echo "Docs only update, no build needed."
        }
      }
    }
    // in order to have the newest images from upstream (with all the security
    // updates) we clean our local docker cache on tag deployments
    // we don't do this all the time to still profit from image layer caching
    // but we want this on tag deployments in order to ensure that we publish
    // images always with the newest possible images.
    stage ('clean docker image cache') {
      when {
        buildingTag()
        expression {
            !skipRemainingStages
        }
      }
      steps {
        sh script: "docker image prune -af", label: "Pruning images"
      }
    }
    stage ('deploy to test environment') {
      when {
        branch 'testing/push-to-test'
        not {
          environment name: 'SKIP_IMAGE_PUBLISH', value: 'true'
        }
        expression {
            !skipRemainingStages
        }
      }
      environment {
        TOKEN = credentials('git-amazeeio-helmfile-ci-trigger')
      }
      steps {
        catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
          sh script: 'output=$(curl -s -X POST -F token=$TOKEN -F ref=main https://git.amazeeio.cloud/api/v4/projects/86/trigger/pipeline); echo "$output"; echo "$output" | grep -q "project_id" || exit 1', label: "Trigger lagoon-core helmfile sync on amazeeio-test6"
        }
      }
    }
  }

  post {
    always {
      sh "make docker_buildx_clean k3d/clean"
    }
    success {
      notifySlack('SUCCESS')
      deleteDir()
    }
    failure {
      notifySlack('FAILURE')
    }
    aborted {
      notifySlack('ABORTED')
    }
  }
}

def notifySlack(String status) {
  slackSend(
    color: ([STARTED: '#68A1D1', SUCCESS: '#BDFFC3', FAILURE: '#FF9FA1', ABORTED: '#949393'][status]),
    message: "${status}: `${env.JOB_NAME}` #${env.BUILD_NUMBER}:\n${env.BUILD_URL}")
}
