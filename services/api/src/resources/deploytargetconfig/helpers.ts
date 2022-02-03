import * as R from 'ramda';
import { Pool } from 'mariadb';
import { query } from '../../util/db';
import { Sql } from './sql';

export const Helpers = (sqlClientPool: Pool) => {
  const aliasOpenshiftToK8s = (deploytargetConfigs: any[]) => {
    return deploytargetConfigs.map(deploytargetConfigs => {
      return {
        ...deploytargetConfigs,
        kubernetesNamespaceName: deploytargetConfigs.deployTargetProjectPattern
      };
    });
  };

  const getDeployTargetConfigById = async (deploytargetID: number) => {
    const rows = await query(
      sqlClientPool,
      Sql.selectDeployTargetConfigById(deploytargetID)
    );
    const withK8s = aliasOpenshiftToK8s(rows);
    return R.prop(0, withK8s);
  };

  return {
    aliasOpenshiftToK8s,
    getDeployTargetConfigById,
  };
};
