import { Helpers } from './helpers';
import { Sql } from './sql';
import { ResolverFn } from '../index';
import { logger } from '../../loggers/logger';

export const getUIProjects: ResolverFn = async (
  root,
  { limit, skip },
  { sqlClientPool, hasPermission, models, keycloakGrant }
) => {
  let userProjectIds: number[];

  try {
    await hasPermission('project', 'viewAll');
  } catch (err) {
    if (!keycloakGrant) {
      logger.warn('No grant available for getAllProjects');
      return [];
    }

    // get project ids from access_token attribute
    if (keycloakGrant.access_token.content.projects.length > 0) {
      userProjectIds = keycloakGrant.access_token.content.projects
    }
  }

  const projects = await Helpers(sqlClientPool)
    .getProjectsByIds(
      userProjectIds,
      limit,
      skip
    );

  return projects;
};


