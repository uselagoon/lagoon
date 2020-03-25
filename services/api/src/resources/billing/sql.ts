import { knex } from '../../util/db';
import { BillingModifier } from '../../models/billing';

const BILLING_MODIFIER_TABLE = 'billing_modifier';


export const Sql = {
  // create
  addBillingModifier: (modifier: BillingModifier) =>
    knex(BILLING_MODIFIER_TABLE).insert(modifier).toString(),
  // read
  selectBillingModifier: (id: number) =>
    knex(BILLING_MODIFIER_TABLE).where('id', '=', id).toString(),
  getAllBillingModifierByBillingGroup: (group_id: string, monthStart: string = undefined, monthEnd: string = undefined) => {
    return monthStart === undefined ?
      knex(BILLING_MODIFIER_TABLE).where('group_id', '=', group_id).orderBy('weight', 'asc').toString() :
      knex(BILLING_MODIFIER_TABLE)
        .where('group_id', '=', group_id)
        .where('start_date', '<=', monthEnd) // modifiers that start before the end of the current month
        .where('end_date', '>=', monthStart) // modifiers that end after the beginning of the current month
        .orderBy('weight', 'asc')
        .toString();
  },
  // update
  updateBillingModifier: (id: number, modifier: BillingModifier) =>
    knex(BILLING_MODIFIER_TABLE).where('id', '=', id).update(modifier).toString(),
  // delete
  deleteBillingModifier: (id: number) =>
    knex(BILLING_MODIFIER_TABLE).where('id', '=', id).delete().toString(),
  deleteAllBillingModifiersByBillingGroup: (group_id: string) =>
    knex(BILLING_MODIFIER_TABLE).where('group_id', '=', group_id).delete().toString()
};

export default Sql;
