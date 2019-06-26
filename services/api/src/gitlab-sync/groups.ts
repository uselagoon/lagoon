import * as R from 'ramda';
import * as gitlabApi from '@lagoon/commons/src/gitlabApi';
import * as api from '@lagoon/commons/src/api';
import { logger } from '@lagoon/commons/src/local-logging';

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

(async () => {
  const allGroups = await gitlabApi.getAllGroups();

  for (const group of sortGroupsByHierarchy(allGroups) as GitlabGroup[]) {
    const groupName = api.sanitizeGroupName(group.full_path);

    try {
      if (group.parent_id) {
        const parentGroup = await gitlabApi.getGroup(group.parent_id);
        await api.addGroupWithParent(groupName, api.sanitizeGroupName(parentGroup.full_path));
      } else {
        await api.addGroup(groupName);
      }
    } catch (err) {
      if (!R.match(groupExistsRegex, err.message)) {
        logger.error(`Could not sync (add) gitlab group ${group.name} id ${group.id}: ${err.message}`);
        continue;
      }
    }

    const groupMembers = await gitlabApi.getGroupMembers(group.id);

    for (const member of groupMembers) {
      const user = await gitlabApi.getUser(member.id);

      try {
        await api.addUserToGroup(user.email, groupName, convertRoleNumberToString(member.access_level));
      } catch (err) {
        logger.error(`Could not sync (add) gitlab group ${group.name} membership ${user.email}: ${err.message}`);
      }
    }
  }
})()
