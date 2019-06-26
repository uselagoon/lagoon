import * as R from 'ramda';
import * as sshpk from 'sshpk';
import * as gitlabApi from '@lagoon/commons/src/gitlabApi';
import * as api from '@lagoon/commons/src/api';
import { logger } from '@lagoon/commons/src/local-logging';

interface GitlabProject {
  id: number,
  path: string,
  ssh_url_to_repo: string,
  namespace: {
    kind: string,
    path: string,
    full_path: string,
  },
};

const projectExistsRegex = /Duplicate entry '[^']+' for key 'name'/;
const convertRoleNumberToString = R.cond([
  [R.equals(10), R.always('GUEST')],
  [R.equals(20), R.always('REPORTER')],
  [R.equals(30), R.always('DEVELOPER')],
  [R.equals(40), R.always('MAINTAINER')],
  [R.equals(50), R.always('OWNER')],
]);

(async () => {
  const allProjects = await gitlabApi.getAllProjects() as GitlabProject[];

  for (const project of allProjects) {
    const { id, path: projectName, ssh_url_to_repo: gitUrl, namespace } = project;
    const openshift = 1;
    const productionenvironment = "master";

    if (project.namespace.kind != 'group') {
      logger.info(`Skipping creation of project ${projectName}: not in group namespace`);
      continue;
    }

    let lagoonProject;
    try {
      const result = await api.addProject(projectName, gitUrl, openshift, productionenvironment);
      lagoonProject = R.prop('addProject', result);
    } catch (err) {
      if (R.match(projectExistsRegex, err.message)) {
        lagoonProject = await api.getProjectByName(projectName);
      } else {
        logger.error(`Could not sync (add) gitlab project ${projectName}: ${err.message}`);
        continue;
      }
    }

    try {
      const privateKey = R.pipe(
        R.prop('privateKey'),
        sshpk.parsePrivateKey,
      )(lagoonProject);
      //@ts-ignore
      const publicKey = privateKey.toPublic();

      await gitlabApi.addDeployKeyToProject(id, publicKey.toString());
    } catch (err) {
      logger.error(`Could not add deploy_key to gitlab project ${id}, reason: ${err}`);
    }

    try {
      // In Gitlab each project has an Owner, which is in this case a Group that already should be created before.
      // We add this owner Group to the Project.
      await api.addGroupToProject(projectName, api.sanitizeGroupName(namespace.full_path));
    } catch (err) {
      logger.error(`Could not sync (add) gitlab project ${projectName} group ${namespace.path}: ${err.message}`);
    }

    const projectMembers = await gitlabApi.getProjectMembers(project.id);

    for (const member of projectMembers) {
      const user = await gitlabApi.getUser(member.id);

      try {
        await api.addUserToGroup(user.email, `project-${projectName}`, convertRoleNumberToString(member.access_level));
      } catch (err) {
        logger.error(`Could not sync (add) gitlab project ${projectName} membership ${user.email}: ${err.message}`);
      }
    }
  }
})()
