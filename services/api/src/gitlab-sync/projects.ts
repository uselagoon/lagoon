import * as R from 'ramda';
import * as sshpk from 'sshpk';
import * as gitlabApi from '@lagoon/commons/dist/gitlab/api';
import * as api from '@lagoon/commons/dist/api';
import { logger } from '@lagoon/commons/dist/logs/local-logger';

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

const syncProject = async (project) => {
  const { id, path, ssh_url_to_repo: gitUrl, namespace } = project;
  const projectName = api.sanitizeProjectName(path);
  const openshift = 1;
  const productionenvironment = "master";
  logger.debug(`Processing ${projectName}`);

  if (project.namespace.kind != 'group') {
    logger.info(`Skipping creation of project ${projectName}: not in group namespace`);
    return;
  }

  let lagoonProject;
  try {
    const result = await api.addProject(projectName, gitUrl, openshift, productionenvironment);
    lagoonProject = R.prop('addProject', result);
  } catch (err) {
    if (R.test(projectExistsRegex, err.message)) {
      lagoonProject = await api.getProjectByName(projectName);
    } else {
      throw new Error(`Could not sync (add) gitlab project ${projectName}: ${err.message}`);
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
    if (!err.message.includes('has already been taken')) {
      throw new Error(`Could not add deploy_key to gitlab project ${id}, reason: ${err}`);
    }
  }

  // In Gitlab each project has an Owner, which is in this case a Group that already should be created before.
  // We add this owner Group to the Project.
  await api.addGroupToProject(projectName, api.sanitizeGroupName(namespace.full_path));

  const projectMembers = await gitlabApi.getProjectMembers(project.id);

  for (const member of projectMembers) {
    const user = await gitlabApi.getUser(member.id);

    await api.addUserToGroup(user.email, `project-${projectName}`, convertRoleNumberToString(member.access_level));
  }
};

(async () => {
  const allProjects = await gitlabApi.getAllProjects() as GitlabProject[];
  let projectsQueue = allProjects.map(project => ({ project, retries: 0}));

  logger.info(`Syncing ${allProjects.length} projects`);

  while (projectsQueue.length > 0) {
    const { project, retries } = projectsQueue.shift();
    try {
      await syncProject(project);
    } catch (err) {
      if (retries < 3) {
        logger.warn(`Error syncing, adding to end of queue: ${err.message}`);
        projectsQueue.push({ project, retries: retries + 1 });
      }
      else {
        logger.error(`Sync failed: ${err.message}`);
      }
    }
  }

  logger.info('Sync completed');
})()
