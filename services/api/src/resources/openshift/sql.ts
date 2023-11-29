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
    buildImage,
    sharedBaasBucketName
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
    sharedBaasBucketName?: string;
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
        buildImage,
        sharedBaasBucketName
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
      .toString(),
  selectOpenshiftByProjectId: (id: number) =>
    knex('project AS p')
      .select('openshift.*')
      .join('openshift', 'openshift.id', '=', 'p.openshift')
      .where(knex.raw('p.id = ?', id))
      .toString(),
  selectProjectIdByDeployTargetId: (id: number) =>
    knex('deploy_target_config AS d')
      .select('d.project')
      .where(knex.raw('d.id = ?', id))
      .toString(),
  selectOpenshiftByDeployTargetId: (id: number) =>
    knex('deploy_target_config AS d')
      .select('openshift.*')
      .join('openshift', 'openshift.id', '=', 'd.deploy_target')
      .where(knex.raw('d.id = ?', id))
      .toString(),
  selectOpenshiftByEnvironmentId: (id: number) =>
    knex('environment AS e')
      .select('openshift.*')
      .join('openshift', 'openshift.id', '=', 'e.openshift')
      .where(knex.raw('e.id = ?', id))
      .toString(),
};
