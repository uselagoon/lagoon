import R from 'ramda';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';
import { createDeployTask } from '@lagoon/commons/dist/tasks';
import { generateBuildId } from '@lagoon/commons/dist/util';

import { WebhookRequestData, deployData, Project } from '../types';

export async function gitlabPullRequestUpdated(webhook: WebhookRequestData, project: Project) {

    const {
      webhooktype,
      event,
      giturl,
      uuid,
      body,
    } = webhook;

    const meta = {
      projectName: project.name,
      pullrequestNumber: body.object_attributes.id,
      pullrequestTitle: body.object_attributes.title,
      pullrequestUrl: body.object_attributes.url,
      repoName: body.object_attributes.target.name,
      repoUrl: body.object_attributes.target.web_url,
    }

    const headRepoId = body.object_attributes.source.git_ssh_url
    const headBranchName = body.object_attributes.source_branch
    const headSha = body.object_attributes.last_commit.id
    const baseRepoId = body.object_attributes.target.git_ssh_url
    const baseBranchName = body.object_attributes.target_branch
    const baseSha = `origin/${body.object_attributes.target_branch}` // gitlab does not send us the target sha, we just use the target_branch

    // Don't trigger deploy if the head and base repos are different
    if (!R.equals(headRepoId, baseRepoId)) {
      sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:${event}:handledButNoTask`, meta,
        `*[${project.name}]* PR ${body.number} updated. No deploy task created, reason: Target/Source not same repo`
      )
      return;
    }

    let buildName = generateBuildId();

    const data: deployData = {
      repoUrl: body.object_attributes.target.web_url,
      repoName: body.object_attributes.target.name,
      pullrequestUrl: body.object_attributes.url,
      pullrequestTitle: body.object_attributes.title,
      pullrequestNumber: body.object_attributes.id,
      projectName: project.name,
      type: 'pullrequest',
      headBranchName: headBranchName,
      headSha: headSha,
      baseBranchName: baseBranchName,
      baseSha: baseSha,
      branchName: `pr-${body.object_attributes.id}`,
      buildName: buildName
    }

    try {
      await createDeployTask(data);
      // gitlab does not identify well that this is an update to a merge request, so we manually set the event type here.
      sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:${event}:updated:handled`, data,
        `*[${project.name}]* PR <${body.object_attributes.url}|#${body.object_attributes.id} (${body.object_attributes.title})> updated in <${body.object_attributes.target.web_url}|${body.object_attributes.target.name}>`
      )
      return;
    } catch (error) {
      switch (error.name) {
        case "ProjectNotFound":
        case "NoActiveSystemsDefined":
        case "UnknownActiveSystem":
          // These are not real errors and also they will happen many times. We just log them locally but not throw an error
          sendToLagoonLogs('info', project.name, uuid, `${webhooktype}:${event}:handledButNoTask`, meta,
            `*[${project.name}]* PR ${body.object_attributes.id} updated. No deploy task created, reason: ${error}`
          )
          return;

        default:
          // Other messages are real errors and should reschedule the message in RabbitMQ in order to try again
          throw error
      }
    }
}
