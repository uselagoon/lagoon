import { knex } from '../../util/db';

export const Sql = {
  insertOpenshift: ({
    id,
    name,
    consoleUrl,
    token,
    routerPattern,
    sshHost,
    sshPort,
    monitoringConfig,
    friendlyName,
    cloudProvider,
    cloudRegion,
    buildImage
  }: {
    id?: number;
    name: string;
    consoleUrl: string;
    token?: string;
    routerPattern?: string;
    sshHost?: string;
    sshPort?: string;
    monitoringConfig?: JSON;
    friendlyName?: string;
    cloudProvider?: string;
    cloudRegion?: string;
    buildImage?: string;
  }) =>
    knex('openshift')
      .insert({
        id,
        name,
        consoleUrl,
        token,
        routerPattern,
        sshHost,
        sshPort,
        monitoringConfig,
        friendlyName,
        cloudProvider,
        cloudRegion,
        buildImage
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
  selectOpenshiftByName: (name: string) =>
    knex('openshift')
      .where('name', '=', name)
      .toString(),
  truncateOpenshift: () =>
    knex('openshift')
      .truncate()
      .toString()
};
