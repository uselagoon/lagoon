import R from 'ramda';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { createDeployTask } from '@lagoon/commons/dist/tasks';
import { generateBuildId } from '@lagoon/commons/dist/util/lagoon';

import { WebhookRequestData, deployData, Project } from '../types';

export async function giteaPullRequestOpened(webhook: WebhookRequestData, project: Project) {

    const {
      webhooktype,
      event,
      giturl,
      uuid,
      body,
    } = webhook;

    const headRepoId = body.pull_request.head.repo.id
    const headBranchName = body.pull_request.head.ref
    const headSha = body.pull_request.head.sha
    const baseRepoId = body.pull_request.base.repo.id
    const baseBranchName = body.pull_request.base.ref
    const baseSha = body.pull_request.base.sha

    const meta = {
      projectName: project.name,
      pullrequestTitle: body.pull_request.title,
      pullrequestNumber: body.number,
      pullrequestUrl: body.pull_request.html_url,
      repoName: body.repository.full_name,
      repoUrl: body.repository.html_url,
    }

    if (project.deploymentsDisabled == 1) {
      sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:${event}:handledButNoTask`, meta,
        `*[${project.name}]* No deploy task created, reason: deployments are disabled`
      )
      return;
    }

    // Don't trigger deploy if the head and base repos are different
    if (!R.equals(headRepoId, baseRepoId)) {
      sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:${event}:handledButNoTask`, meta,
        `*[${project.name}]* PR ${body.number} opened. No deploy task created, reason: Head/Base not same repo`
      )
      return;
    }

    let buildName = generateBuildId();

    const data: deployData = {
      repoUrl: body.repository.html_url,
      repoName: body.repository.full_name,
      pullrequestTitle: body.pull_request.title,
      pullrequestNumber: body.number,
      pullrequestUrl: body.pull_request.html_url,
      projectName: project.name,
      type: 'pullrequest',
      headBranchName: headBranchName,
      headSha: headSha,
      baseBranchName: baseBranchName,
      baseSha: baseSha,
      branchName: `pr-${body.number}`,
      buildName: buildName
    }

    try {
      await createDeployTask(data);
      sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:${event}:opened:handled`, meta,
        `*[${project.name}]* PR <${body.pull_request.html_url}|#${body.number} (${body.pull_request.title})> opened in <${body.repository.html_url}|${body.repository.full_name}>`
      )
      return;
    } catch (error) {
      switch (error.name) {
        case "ProjectNotFound":
        case "NoActiveSystemsDefined":
        case "UnknownActiveSystem":
          // These are not real errors and also they will happen many times. We just log them locally but not throw an error
          sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:${event}:handledButNoTask`, meta,
            `*[${project.name}]* PR ${body.number} opened. No deploy task created, reason: ${error}`
          )
          return;

        default:
          // Other messages are real errors and should reschedule the message in RabbitMQ in order to try again
          throw error
      }
    }
}
