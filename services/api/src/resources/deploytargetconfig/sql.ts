import { knex } from '../../util/db';

export const Sql = {
  updateDeployTargetConfig: ({ id, patch }: { id: number, patch: { [key: string]: any } }) => {
    const updatePatch = {
      ...patch,
    };

    return knex('deploy_target_config')
    .where('id', '=', id)
    .update(updatePatch)
    .toString();
  },
  selectDeployTargetConfigById: (id: number) =>
    knex('deploy_target_config')
      .where('id', '=', id)
      .toString(),
  truncateDeployTargetConfigs: () =>
    knex('deploy_target_config')
      .truncate()
      .toString(),
  updateProjectBranchPullrequestRegex: (id: number) =>
    knex('project')
      .update('branches', 'This project is configured with DeployTargets')
      .update('pullrequests', 'This project is configured with DeployTargets')
      .where('id', '=', id)
      .toString(),
  selectDeployTargetConfigsByProjectId: (id: number) =>
    knex('deploy_target_config')
      .where('project', '=', id)
      .orderBy('weight', 'desc')
      .toString(),
  selectDeployTargetConfigsByDeployTarget: (id: number) =>
    knex('deploy_target_config AS d')
      .select('d.*')
      .where('deploy_target', '=', id)
      .toString(),
  insertDeployTargetConfig: ({
    id,
    project,
    weight,
    deployTarget,
    deployTargetProjectPattern,
    branches,
    pullrequests
  }: {
    id: number,
    project: number,
    weight: number,
    deployTarget: number,
    deployTargetProjectPattern: number,
    branches: number,
    pullrequests: string
  }) =>
    knex('deploy_target_config')
      .insert({
        id,
        project,
        weight,
        deployTarget,
        deployTargetProjectPattern,
        branches,
        pullrequests
      })
      .toString(),
};
