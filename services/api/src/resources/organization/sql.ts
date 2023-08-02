import { knex } from '../../util/db';

export const Sql = {
  insertOrganization: ({
    id,
    name,
    friendlyName = name, // default to name if not provided
    description,
    quotaProject,
    quotaGroup,
    quotaNotification,
    quotaEnvironment
  }: {
    id?: number;
    name: string;
    friendlyName: string;
    description: string;
    quotaProject?: number;
    quotaGroup?: number;
    quotaNotification?: number;
    quotaEnvironment?: number;
  }) =>
    knex('organization')
      .insert({
        id,
        name,
        friendlyName,
        description,
        quotaProject,
        quotaGroup,
        quotaNotification,
        quotaEnvironment,
      })
      .toString(),
  updateProjectOrganization: ({
    pid,
    patch,
  }: {
    pid: number;
    patch: { [key: string]: any };
  }) =>
    knex('project')
      .where('id', '=', pid)
      .update(patch)
      .toString(),
  addDeployTarget: ({
    orgid,
    dtid
  }: {
    orgid?: number;
    dtid?: number;
  }) =>
    knex('organization_deploy_target')
      .insert({
        orgid,
        dtid,
      })
      .toString(),
  updateOrganization: ({
    id,
    patch
  }: {
    id: number;
    patch: { [key: string]: any };
  }) =>
    knex('organization')
      .where('id', '=', id)
      .update(patch)
      .toString(),
  selectOrganization: (id: number) =>
    knex('organization')
      .where('id', '=', id)
      .toString(),
  selectOrganizationProjects: (id: number) =>
    knex('project')
      .where('organization', '=', id)
      .toString(),
  selectOrganizationEnvironments: (id: number) =>
    knex('organization')
      .select('e.*')
      .join('project AS p', 'p.organization', '=', 'organization.id')
      .join('environment AS e', 'e.project', '=', 'p.id')
      .where(knex.raw('organization.id = ?', id))
      .andWhere('e.deleted', '0000-00-00 00:00:00')
      .toString(),
  selectNotificationsByTypeByProjectId: (input) => {
    const {
      type,
      pid,
      oid,
      contentType = 'deployment',
      notificationSeverityThreshold = 0
    } = input;
    let selectQuery = knex('project_notification AS pn').join('project', 'project.id', 'pn.pid').joinRaw(
      `JOIN notification_${type} AS nt ON pn.nid = nt.id AND pn.type = :type AND pn.content_type = :contentType`,
      { type, contentType }
    );

    return selectQuery
      .where('pn.pid', '=', pid)
      .where(
        'pn.notification_severity_threshold',
        '>=',
        notificationSeverityThreshold
      )
      .andWhere('project.organization', '=', oid)
      .andWhere('project.id', '=', pid)
      .select(
        'nt.*',
        'pn.type',
      )
      .toString();
  },
  selectNotificationsByTypeByOrganizationId: (input) =>{
    const {
      type,
      id,
    } = input;
    return knex(`notification_${type}`)
      .where('organization', '=', id)
      .toString();
  },

  selectOrganizationDeployTargets: (id: number) =>
    knex('organization_deploy_target')
      .where('orgid', '=', id)
      .toString(),
  selectDeployTargetsByOrganization: (id: number) =>
    knex('openshift as dt')
      .select('dt.*')
      .join('organization_deploy_target as odt', 'dt.id', '=', 'odt.dtid')
      .where('odt.orgid', '=', id)
      .toString()
};
