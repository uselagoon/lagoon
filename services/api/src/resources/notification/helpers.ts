import * as R from 'ramda';
import { Pool } from 'mariadb';
import { query } from '../../util/db';
import { Sql } from './sql';

export const Helpers = (sqlClientPool: Pool) => ({
  getAssignedNotificationIds: async (
    { name, type }: { name: string, type: string },
  ) => {
    const result = await query(
      sqlClientPool,
      Sql.selectProjectNotificationByNotificationName({ name, type }),
    );

    return R.map(R.prop('nid'), result);
  },
  selectNotificationsByProjectId: async (
    { project }: { project: number },
  ) => {
    let input = {pid: project, type: "slack"}
    // get all the notifications for the projects
    const slacks = await query(
      sqlClientPool,
      Sql.selectNotificationsByTypeByProjectId(input)
    );
    input.type = "rocketchat"
    const rcs = await query(
      sqlClientPool,
      Sql.selectNotificationsByTypeByProjectId(input)
    );
    input.type = "microsoftteams"
    const teams = await query(
      sqlClientPool,
      Sql.selectNotificationsByTypeByProjectId(input)
    );
    input.type = "email"
    const email = await query(
      sqlClientPool,
      Sql.selectNotificationsByTypeByProjectId(input)
    );
    input.type = "webhook"
    const webhook = await query(
      sqlClientPool,
      Sql.selectNotificationsByTypeByProjectId(input)
    );
    let result = [...slacks, ...rcs, ...teams, ...email, ...webhook]

    return result
  },
  removeAllNotificationsFromProject: async (
    { project }: { project: number },
  ) => {
    await query(sqlClientPool, Sql.deleteProjectNotificationByProjectId(project, "slack"));
    await query(sqlClientPool, Sql.deleteProjectNotificationByProjectId(project, "rocketchat"));
    await query(sqlClientPool, Sql.deleteProjectNotificationByProjectId(project, "microsoftteams"));
    await query(sqlClientPool, Sql.deleteProjectNotificationByProjectId(project, "email"));
    await query(sqlClientPool, Sql.deleteProjectNotificationByProjectId(project, "webhook"));
  },
  selectAllNotifications: async (name: string = null) => {
    let type = "slack"
    // get all notifications
    const slacks = await query(
      sqlClientPool,
      name ?
      Sql.selectAllNotificationsByName(name, type) : Sql.selectAllNotifications(type)
    );
    type = "rocketchat"
    const rcs = await query(
      sqlClientPool,
      name ?
      Sql.selectAllNotificationsByName(name, type) : Sql.selectAllNotifications(type)
    );
    type = "microsoftteams"
    const teams = await query(
      sqlClientPool,
      name ?
      Sql.selectAllNotificationsByName(name, type) : Sql.selectAllNotifications(type)
    );
    type = "email"
    const email = await query(
      sqlClientPool,
      name ?
      Sql.selectAllNotificationsByName(name, type) : Sql.selectAllNotifications(type)
    );
    type = "webhook"
    const webhook = await query(
      sqlClientPool,
      name ?
      Sql.selectAllNotificationsByName(name, type) : Sql.selectAllNotifications(type)
    );
    let result = [...slacks, ...rcs, ...teams, ...email, ...webhook]

    return result
  },
});
