import { knex } from '../../util/db';

export const Sql = {
  insertOrganization: ({
    id,
    name,
    friendlyName = name, // default to name if not provided
    description = "",
    quotaProject,
    quotaGroup,
    quotaNotification,
    quotaEnvironment,
    quotaRoute
  }: {
    id?: number;
    name: string;
    friendlyName: string;
    description: string;
    quotaProject?: number;
    quotaGroup?: number;
    quotaNotification?: number;
    quotaEnvironment?: number;
    quotaRoute?: number;
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
        quotaRoute,
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
  selectOrganizationByName: (name: string) =>
    knex('organization')
      .where('name', '=', name)
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
  selectNotificationsByTypeByOrganizationId: (input) =>{
    const {
      type,
      id,
    } = input;
    return knex(`notification_${type}`)
      .select(
        '*',
        knex.raw(`'${type}' as type`)
      )
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
      .toString(),
  selectDeployTargetsByOrganizationAndDeployTarget: (id: number, dtid: number) =>
    knex('openshift as dt')
      .select('dt.*')
      .join('organization_deploy_target as odt', 'dt.id', '=', 'odt.dtid')
      .where('odt.orgid', '=', id)
      .andWhere('odt.dtid', '=', dtid)
      .toString(),
  deleteOrganization: (id: number) =>
    knex('organization')
      .where('id', '=', id)
      .delete()
      .toString(),
  deleteOrganizationDeployTargets: (id: number) =>
    knex('organization_deploy_target')
      .where('orgid', '=', id)
      .delete()
      .toString(),
  removeDeployTarget: (orgid: number, dtid: number) =>
    knex('organization_deploy_target')
      .where('orgid', '=', orgid)
      .andWhere('dtid', '=', dtid)
      .delete()
      .toString(),
};
