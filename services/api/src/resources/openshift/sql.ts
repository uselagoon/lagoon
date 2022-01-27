import { knex } from '../../util/db';

export const Sql = {
  insertOpenshift: ({
    id,
    name,
    consoleUrl,
    token,
    routerPattern,
    projectUser,
    sshHost,
    sshPort,
    monitoringConfig,
    friendlyName,
    maintenanceZone,
    supportRegion,
    cloudProvider,
    cloudRegion
  }: {
    id?: number;
    name: string;
    consoleUrl: string;
    token?: string;
    routerPattern?: string;
    projectUser?: string;
    sshHost?: string;
    sshPort?: string;
    monitoringConfig?: JSON;
    friendlyName?: string;
    maintenanceZone?: string;
    supportRegion?: string;
    cloudProvider?: string;
    cloudRegion?: string;
  }) =>
    knex('openshift')
      .insert({
        id,
        name,
        consoleUrl,
        token,
        routerPattern,
        projectUser,
        sshHost,
        sshPort,
        monitoringConfig,
        friendlyName,
        maintenanceZone,
        supportRegion,
        cloudProvider,
        cloudRegion
      })
      .toString(),
  updateOpenshift: ({
    id,
    patch
  }: {
    id: number;
    patch: { [key: string]: any };
  }) =>
    knex('openshift')
      .where('id', '=', id)
      .update(patch)
      .toString(),
  selectOpenshift: (id: number) =>
    knex('openshift')
      .where('id', '=', id)
      .toString(),
  truncateOpenshift: () =>
    knex('openshift')
      .truncate()
      .toString()
};
