// @ts-ignore
import * as R from 'ramda';
// @ts-ignore
import { Pool } from 'mariadb';
import { query } from '../../util/db';
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
    getEnvironmentsByOrganizationId,
  }
};