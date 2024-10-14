import { knex } from '../../util/db';

export const Sql = {
  updateRetentionPolicy: ({ id, patch }: { id: number, patch: { [key: string]: any } }) => {
    const updatePatch = {
      ...patch,
      updated: knex.fn.now(),
    };
    return knex('retention_policy')
      .where('id', '=', id)
      .update(updatePatch)
      .toString();
  },
  selectRetentionPolicyById: (id: number) =>
    knex('retention_policy')
      .where('id', '=', id)
      .toString(),
  selectRetentionPolicyByName: (name: string) =>
    knex('retention_policy')
      .where('name', '=', name)
      .toString(),
  selectRetentionPolicyByNameAndType: (name: string, type: string) =>
    knex('retention_policy')
      .where('name', '=', name)
      .where('type', '=', type)
      .toString(),
  selectRetentionPoliciesByType: (type: string) =>
    knex('retention_policy')
      .where('type', '=', type)
      .toString(),
  selectRetentionPoliciesByLink: (id: number, scope: string) =>
    knex('retention_policy as rp')
      .select('rp.*')
      .join('retention_policy_reference', 'rp.id', '=', 'retention_policy_reference.retention_policy')
      .where(knex.raw('retention_policy_reference.scope = ?', scope))
      .andWhere(knex.raw('retention_policy_reference.id = ?', id))
      .toString(),
  selectRetentionPoliciesByTypeAndLink: (type: string, id: number, scope: string) =>
    knex('retention_policy as rp')
      .select('rp.*')
      .join('retention_policy_reference', 'rp.id', '=', 'retention_policy_reference.retention_policy')
      .where(knex.raw('retention_policy_reference.scope = ?', scope))
      .andWhere(knex.raw('retention_policy_reference.id = ?', id))
      .andWhere(knex.raw('rp.type = ?', type))
      .toString(),
  selectRetentionPoliciesByTypePolicyIDAndLink: (type: string, policyId: number, id: number, scope: string) =>
    knex('retention_policy as rp')
      .select('rp.*')
      .join('retention_policy_reference', 'rp.id', '=', 'retention_policy_reference.retention_policy')
      .where(knex.raw('retention_policy_reference.scope = ?', scope))
      .andWhere(knex.raw('retention_policy_reference.id = ?', id))
      .andWhere(knex.raw('rp.type = ?', type))
      .andWhere(knex.raw('rp.id = ?', policyId))
      .toString(),
  selectRetentionPoliciesByLinkAndPolicyID: (id: number, scope: string) =>
    knex('retention_policy as rp')
      .select('rp.*')
      .join('retention_policy_reference', 'rp.id', '=', 'retention_policy_reference.retention_policy')
      .where(knex.raw('retention_policy_reference.scope = ?', scope))
      .andWhere(knex.raw('rp.id = ?', id))
      .toString(),
  selectScopeIDsByRetentionPolicyTypeExcludingPolicyID: (type: string, scope: string, policyId: number) =>
    knex('retention_policy as rp')
      .select(knex.raw('group_concat(rpr.id) as scope_ids'))
      .join('retention_policy_reference as rpr', 'rp.id', '=', 'rpr.retention_policy')
      .where(knex.raw('rpr.scope = ?', scope))
      .andWhere(knex.raw('rp.type = ?', type))
      .whereNot(knex.raw('rp.id = ?', policyId))
      .toString(),
  selectScopeIDsByRetentionPolicyTypeIncludingPolicyID: (type: string, scope: string, policyId: number) =>
    knex('retention_policy as rp')
      .select(knex.raw('group_concat(rpr.id) as scope_ids'))
      .join('retention_policy_reference as rpr', 'rp.id', '=', 'rpr.retention_policy')
      .where(knex.raw('rpr.scope = ?', scope))
      .andWhere(knex.raw('rp.type = ?', type))
      .andWhere(knex.raw('rp.id = ?', policyId))
      .toString(),
  deleteRetentionPolicy: (id: number) =>
    knex('retention_policy')
      .where('id', '=', id)
      .delete()
      .toString(),
  deleteRetentionPolicyLink: (id: number, scope: string, sid: number) =>
    knex('retention_policy_reference')
      .where('retention_policy', '=', id)
      .andWhere('scope', '=', scope)
      .andWhere('id', '=', sid)
      .delete()
      .toString(),
  createRetentionPolicy: (input) => {
    const {
      id,
      name,
      type,
      configuration
    } = input;
    return knex('retention_policy').insert({
      id,
      name,
      type,
      configuration
    }).toString();
  },
  addRetentionPolicyLink: (id: number, scope: string, sid: number) => {
    return knex('retention_policy_reference').insert({
      retentionPolicy: id,
      scope,
      id: sid
    }).toString();
  },
  selectDeployTargetsForRetentionByProject: (pid: number) =>
    knex('project as p')
      .select('p.name', 'p.id as pid', 'p.organization', 'dt.id as dtid', 'dt.name as dtname')
      .join('environment as e', 'p.id', '=', 'e.project')
      .join('openshift as dt', 'dt.id', '=', 'e.openshift')
      .where('e.deleted', '0000-00-00 00:00:00')
      .andWhere(knex.raw('p.id = ?', pid))
      .groupBy('p.name', 'e.openshift')
      .toString(),
  selectEnvironmentsForRetentionByProject: (pid: number) =>
    knex('project as p')
      .select('p.name', 'p.id as pid', 'e.name as ename', 'e.id as eid', 'p.organization', 'dt.id as dtid', 'dt.name as dtname')
      .join('environment as e', 'p.id', '=', 'e.project')
      .join('openshift as dt', 'dt.id', '=', 'e.openshift')
      .where('e.deleted', '0000-00-00 00:00:00')
      .andWhere(knex.raw('p.id = ?', pid))
      .toString(),
}