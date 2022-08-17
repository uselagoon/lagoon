import { Helpers } from './helpers';
import { ResolverFn } from '../index';
import { logger } from '../../loggers/logger';

export const getUIProjects: ResolverFn = async (
  root,
  { limit, skip },
  { sqlClientPool, hasPermission, models, keycloakGrant }
) => {
  let userProjectIds, groupProjectIds;

  try {
    await hasPermission('project', 'viewAll');
  } catch (err) {
    if (!keycloakGrant) {
      logger.warn('No grant available for getAllProjects');
      return [];
    }

    if (keycloakGrant.access_token.content.group_lagoon_project_ids.length > 0) {
      groupProjectIds = keycloakGrant.access_token.content.group_lagoon_project_ids
    }
  }

  if (groupProjectIds) {
    userProjectIds = [...new Set(groupProjectIds.map((groups) => {
      const groupsJson = JSON.parse(groups)

      let projectIds;
      for (const k in groupsJson) {
        projectIds = [...groupsJson[k]]
      }
      for (const k in projectIds) {
        projectIds = projectIds[k]
      }
      return projectIds;
    }))];
  }

  let projects = [];
  if (userProjectIds) {
    projects = await Helpers(sqlClientPool)
      .getProjectsByIds(
        userProjectIds,
        limit,
        skip
      );
  }

  return projects;
};


