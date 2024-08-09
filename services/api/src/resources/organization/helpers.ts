import * as R from 'ramda';
import { Pool } from 'mariadb';
import { query } from '../../util/db';
import { asyncPipe } from '@lagoon/commons/dist/util/func';
import { Sql } from './sql';

export const Helpers = (sqlClientPool: Pool) => {
  const getOrganizationById = async (id: number) => {
    const rows = await query(sqlClientPool, Sql.selectOrganization(id));
    return R.prop(0, rows);
  };
  const getProjectsByOrganizationId = async (id: number) => {
    const rows = await query(sqlClientPool, Sql.selectOrganizationProjects(id));
    return rows;
  };
  const getEnvironmentsByOrganizationId = async (id: number) => {
    const rows = await query(sqlClientPool, Sql.selectOrganizationEnvironments(id));
    return rows;
  };
  const getNotificationsByTypeForOrganizationId = async (id: number, type: string) => {
    let input = {id: id, type: type}
    const result = await query(
      sqlClientPool,
      Sql.selectNotificationsByTypeByOrganizationId(input)
    );
    return result
  };
  const getNotificationsForOrganizationId = async (id: number) => {
    let input = {id: id, type: "slack"}
    // get all the notifications for the projects
    const slacks = await query(
      sqlClientPool,
      Sql.selectNotificationsByTypeByOrganizationId(input)
    );
    input.type = "rocketchat"
    const rcs = await query(
      sqlClientPool,
      Sql.selectNotificationsByTypeByOrganizationId(input)
    );
    input.type = "microsoftteams"
    const teams = await query(
      sqlClientPool,
      Sql.selectNotificationsByTypeByOrganizationId(input)
    );
    input.type = "email"
    const email = await query(
      sqlClientPool,
      Sql.selectNotificationsByTypeByOrganizationId(input)
    );
    input.type = "webhook"
    const webhook = await query(
      sqlClientPool,
      Sql.selectNotificationsByTypeByOrganizationId(input)
    );
    const result = [...slacks, ...rcs, ...teams, ...email, ...webhook]
    return result
  };
  const getDeployTargetsByOrganizationId = async (id: number) => {
    const rows = await query(sqlClientPool, Sql.selectOrganizationDeployTargets(id));
    return rows;
  };
  return {
    getOrganizationById,
    getProjectsByOrganizationId,
    getDeployTargetsByOrganizationId,
    getNotificationsForOrganizationId,
    getNotificationsByTypeForOrganizationId,
    getEnvironmentsByOrganizationId,
    getOrganizationByOrganizationInput: async (organizationInput, scope: string, resource: string) => {
      const notEmpty = R.complement(R.anyPass([R.isNil, R.isEmpty]));
      const hasId = R.both(R.has('id'), R.propSatisfies(notEmpty, 'id'));
      const hasName = R.both(R.has('name'), R.propSatisfies(notEmpty, 'name'));

      const orgFromId = asyncPipe(R.prop('id'), getOrganizationById, organization => {
        if (!organization) {
          throw new Error(`Unauthorized: You don't have permission to "${scope}" on "${resource}"`);
        }
        return organization;
      });

      const orgFromName = asyncPipe(R.prop('name'), async name => {
        const rows = await query(sqlClientPool, Sql.selectOrganizationByName(name));
        const organization = R.prop(0, rows);
        if (!organization) {
          throw new Error(`Unauthorized: You don't have permission to "${scope}" on "${resource}"`);
        }
        return organization;
      });
      return R.cond([
        [hasId, orgFromId],
        [hasName, orgFromName],
        [
          R.T,
          () => {
            throw new Error('Must provide organization "id" or "name"');
          }
        ]
      ])(organizationInput);
    },
  }
};
