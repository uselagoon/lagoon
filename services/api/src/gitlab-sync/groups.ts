import * as R from 'ramda';
import * as gitlabApi from '@lagoon/commons/dist/gitlabApi';
import * as api from '@lagoon/commons/dist/api';
import { logger } from '@lagoon/commons/dist/logs/local-logger';

interface GitlabGroup {
  id: number,
  name: string,
  full_path: string,
  parent_id: number,
};

const groupExistsRegex = /Group.*?exists/;
const sortGroupsByHierarchy = R.sortBy(R.path(['full_path']));
const convertRoleNumberToString = R.cond([
  [R.equals(10), R.always('GUEST')],
  [R.equals(20), R.always('REPORTER')],
  [R.equals(30), R.always('DEVELOPER')],
  [R.equals(40), R.always('MAINTAINER')],
  [R.equals(50), R.always('OWNER')],
]);

const syncGroup = async group => {
  const groupName = api.sanitizeGroupName(group.full_path);
  logger.debug(`Processing ${group.name} (${groupName})`);

  try {
    if (group.parent_id) {
      const parentGroup = await gitlabApi.getGroup(group.parent_id);
      await api.addGroupWithParent(groupName, api.sanitizeGroupName(parentGroup.full_path));
    } else {
      await api.addGroup(groupName);
    }
  } catch (err) {
    if (!R.test(groupExistsRegex, err.message)) {
      throw new Error(`Could not sync (add) gitlab group ${group.name} id ${group.id}: ${err.message}`);
    }
  }

  const groupMembers = await gitlabApi.getGroupMembers(group.id);

  for (const member of groupMembers) {
    const user = await gitlabApi.getUser(member.id);

    await api.addUserToGroup(user.email, groupName, convertRoleNumberToString(member.access_level));
  }
};

(async () => {
  const allGroups = await gitlabApi.getAllGroups();
  let groupsQueue = sortGroupsByHierarchy(allGroups).map(group => ({ group, retries: 0}));

  logger.info(`Syncing ${allGroups.length} groups`);

  while (groupsQueue.length > 0) {
    const { group, retries } = groupsQueue.shift();
    try {
      await syncGroup(group);
    } catch (err) {
      if (retries < 3) {
        logger.warn(`Error syncing, adding to end of queue: ${err.message}`);
        groupsQueue.push({ group, retries: retries + 1 });
      }
      else {
        logger.error(`Sync failed: ${err.message}`);
      }
    }
  }

  logger.info('Sync completed');
})()
