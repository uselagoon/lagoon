import moment from 'moment';
import R from 'ramda';
import { Pool } from 'mariadb';
import { query } from '../util/db';
import Sql from '../resources/billing/sql';
import { GroupInput, Group, BillingGroup } from './group';

export interface BillingModifierBase {
  id?: number;
  groupId?: string;
  startDate?: string;
  endDate?: string;
  discountFixed?: number;
  discountPercentage?: number;
  extraFixed?: number;
  extraPercentage?: number;
  min?: number;
  max?: number;
  customerComments?: string;
  adminComments?: string;
  weight?: number;
}
export interface BillingModifier extends BillingModifierBase {
  group?: Group;
}

export const BillingModel = (clients: {
  sqlClientPool: Pool;
  keycloakAdminClient: any;
  redisClient: any;
  esClient: any;
}) => {
  const { sqlClientPool } = clients;

  /**
   * Create/Add Billing Modifier
   *
   * @param {BillingModifier} modifier The modifier values
   *
   * @return {BillingModifier} The created modifier
   */
  const addBillingModifier = async (modifier: BillingModifier) => {
    const { insertId } = await query(
      sqlClientPool,
      Sql.addBillingModifier(modifier)
    );
    const rows = await query(
      sqlClientPool,
      Sql.selectBillingModifier(parseInt(insertId, 10))
    );
    return R.prop(0, rows) as BillingModifier;
  };

  /**
   * Get Billing Modifier By ID
   *
   * @param {Int} id The modifier values
   *
   * @return {BillingModifier} The modifier
   */
  const getBillingModifier = async (id: number) => {
    const GroupModel = Group(clients);
    const rows = await query(sqlClientPool, Sql.selectBillingModifier(id));
    if (rows.length === 0) {
      throw new Error('Billing modifier does not exist.');
    }

    const { groupId, ...rest } = R.prop(0, rows) as BillingModifier;
    const group: BillingGroup = await GroupModel.loadGroupByIdOrName({
      id: groupId
    });
    return { ...rest, group };
  };

  /**
   * Get All Billing Modifiers for a Billing Group
   *
   * @param {BillingModifierInput} groupNameOrId The Group Name or ID
   *
   * @return {[BillingModifier]} The created modifier
   */
  const getBillingModifiers = async (
    groupNameOrId: GroupInput,
    month: string
  ) => {
    const GroupModel = Group(clients);
    const group = await GroupModel.loadGroupByIdOrName(groupNameOrId);

    const YEAR_MONTH = 'YYYY-MM-DD HH:mm:ss';
    const monthStart = month
      ? moment(new Date(month).toISOString())
          .startOf('month')
          .format(YEAR_MONTH)
          .toString()
      : undefined;
    const monthEnd = month
      ? moment(new Date(month).toISOString())
          .endOf('month')
          .format(YEAR_MONTH)
          .toString()
      : undefined;

    const sql = Sql.getAllBillingModifierByBillingGroup(
      group.id,
      monthStart,
      monthEnd
    );
    const result = await query(sqlClientPool, sql);
    return result.map(
      ({
        weight,
        discountFixed,
        discountPercentage,
        extraFixed,
        extraPercentage,
        min,
        max,
        ...rest
      }) => ({
        ...rest,
        group,
        weight: parseInt(weight, 10),
        discountFixed: parseFloat(discountFixed),
        discountPercentage: parseFloat(discountPercentage),
        extraFixed: parseFloat(extraFixed),
        extraPercentage: parseFloat(extraPercentage),
        min: parseFloat(min),
        max: parseFloat(max)
      })
    );
  };

  /**
   * Update Billing Modifier
   *
   * @param {BillingModifier} modifier The modifier values
   *
   * @return {BillingModifier} The created modifier
   */
  const updateBillingModifier = async (modifier: BillingModifier) => {
    await query(
      sqlClientPool,
      Sql.updateBillingModifier(modifier.id, modifier)
    );
    return getBillingModifier(modifier.id);
  };

  /**
   * Delete Billing Modifier
   *
   * @param {number} id The modifier id
   *
   * @return {BillingModifier} The created modifier
   */
  const deleteBillingModifier = async (id: number) => {
    await query(sqlClientPool, Sql.deleteBillingModifier(id));
    return 'success';
  };

  /**
   * Delete All Billing Modifiers for a Billing Group
   *
   * @param {GroupInput} groupNameOrId The Billing Group Name or ID
   *
   * @return {Boolean} Success
   */
  const deleteAllBillingGroupModifiers = async (groupNameOrId: GroupInput) => {
    const GroupModel = Group(clients);
    const group = await GroupModel.loadGroupByIdOrName(groupNameOrId);
    const sql = Sql.deleteAllBillingModifiersByBillingGroup(group.id);
    await query(sqlClientPool, sql);
    return 'success';
  };

  return {
    addBillingModifier,
    getBillingModifier,
    getBillingModifiers,
    updateBillingModifier,
    deleteBillingModifier,
    deleteAllBillingGroupModifiers
  };
};

export default BillingModel;
