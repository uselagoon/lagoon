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
  truncateOpenshift: () =>
    knex('openshift')
      .truncate()
      .toString(),
  selectOpenshiftByProjectId: (id: number) =>
    knex('project AS p')
      .select('openshift.*')
      .join('openshift', 'openshift.id', '=', 'p.openshift')
      .where('p.id', '=', id)
      .toString(),
  selectProjectIdByDeployTargetId: (id: number) =>
    knex('deploy_target_config AS d')
      .select('d.project')
      .where('d.id', '=', id)
      .toString(),
  selectOpenshiftByDeployTargetId: (id: number) =>
    knex('deploy_target_config AS d')
      .select('openshift.*')
      .join('openshift', 'openshift.id', '=', 'd.deploy_target')
      .where('d.id', '=', id)
      .toString(),
  selectOpenshiftByEnvironmentId: (id: number) =>
    knex('environment AS e')
      .select('openshift.*')
      .join('openshift', 'openshift.id', '=', 'e.openshift')
      .where('e.id', '=', id)
      .toString(),
};
