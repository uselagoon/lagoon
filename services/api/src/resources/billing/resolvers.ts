import * as R from 'ramda';
const logger = require('../../loggers/logger');
import convertDateToMYSQLDateTimeFormat from '../../util/convertDateToMYSQLDateTimeFormat';
import { BillingModifier, BillingModifierBase } from '../../models/billing';
import { BillingGroup, GroupInput } from '../../models/group';
export interface BillingModifierInput extends BillingModifierBase {
  group: GroupInput;
}

interface AddBillingModifierInput {
  input: BillingModifierInput;
}

interface UpdateBillingModifierInput {
  input: {
    id: number;
    patch: BillingModifier;
  };
}

interface BillingModifiersInput {
  input: GroupInput;
  month?: string;
}

interface DeleteBillingModifierInput {
  input: {
    id: number;
  };
}

interface DeleteAllBillingGroupModifiersInput {
  input: GroupInput;
}

/**
 * Create/Add Billing Modifier
 *
 * @param {obj} root The rootValue passed from the Apollo server configuration.
 * @param {AddBillingModifierInput} args
 * @param {ExpressContext} context this includes the context passed from the apolloServer query
 *     { sqlClient, hasPermissions, keycloakGrant, requestCache }
 *
 * @return {BillingModifier} The created modifier
 */
type AddBillingModifierAlias = (
  root: any,
  args: AddBillingModifierInput,
  context: { models: any; hasPermission: any }
) => Promise<BillingModifier>;
export const addBillingModifier: AddBillingModifierAlias = async (
  _,
  args,
  context
) => {
  const { models, hasPermission } = context;
  const { input } = args;

  // Input Validation
  if (R.isEmpty(input.group)) {
    throw new Error('You must provide a billing group name or id');
  }

  if (R.isEmpty(R.omit(['group', 'startDate', 'endDate'], input))) {
    throw new Error('You must provide a discount value or extra cost.');
  }

  if (new Date(input.startDate) >= new Date(input.endDate)) {
    throw new Error('You must provide a start date before the end date.');
  }

  // Permissions
  await hasPermission('billing_modifier', 'add');

  const { group: groupInput, ...rest } = input;

  const group = await models.GroupModel.loadGroupByIdOrName(groupInput);

  const startDate = convertDateToMYSQLDateTimeFormat(rest.startDate);
  const endDate = convertDateToMYSQLDateTimeFormat(rest.endDate);

  const modifier = { ...rest, groupId: group.id, startDate, endDate };
  const result = await models.BillingModel.addBillingModifier(modifier);
  // Action
  return ({ ...result, group })
};

/**
 * Update Billing Modifier
 *
 * @param {obj} root The rootValue passed from the Apollo server configuration.
 * @param {UpdateBillingModifierInput} args
 * @param {ExpressContext} context this includes the context passed from the apolloServer query
 *     { sqlClient, hasPermissions, keycloakGrant, requestCache }
 *
 * @return {String} Success
 */
export const updateBillingModifier = async (
  _,
  args: UpdateBillingModifierInput,
  context: { models: any; hasPermission: any }
) => {
  const { hasPermission, models } = context;
  const { input, input: { id, patch, patch: { group: groupInput, ...rest  }} } = args;

  if (R.isEmpty(input.patch)) {
    throw new Error('You must provide a patch');
  }

  const existingModifier = await models.BillingModel.getBillingModifier(id);

  // Permissions
  await hasPermission('billing_modifier', 'update', {group: existingModifier.group.id});

  const startDate =
    typeof input != 'undefined' && patch.startDate
      ? { startDate: convertDateToMYSQLDateTimeFormat(patch.startDate) }
      : {};
  const endDate =
    typeof input != 'undefined' && patch.endDate
      ? { endDate: convertDateToMYSQLDateTimeFormat(patch.endDate) }
      : {};

  const modifier = { id, ...rest, groupId: existingModifier.group.id, ...startDate, ...endDate };
  return models.BillingModel.updateBillingModifier(modifier);
};

/**
 * Delete Billing Modifier
 *
 * @param {obj} root The rootValue passed from the Apollo server configuration.
 * @param {DeleteBillingModifierInput} args
 * @param {ExpressContext} context this includes the context passed from the apolloServer query
 *     { sqlClient, hasPermissions, keycloakGrant, requestCache }
 *
 * @return {String} Success
 */
export const deleteBillingModifier = async (
  _,
  args: DeleteBillingModifierInput,
  context: { models: any; hasPermission: any }
) => {
  const { hasPermission, models } = context;
  const {
    input: { id }
  } = args;

  const { group } = await models.BillingModel.getBillingModifier(id);

  // Permissions
  await hasPermission('billing_modifier', 'delete', { group: group.id });

  // Action
  return models.BillingModel.deleteBillingModifier(id);
};

/**
 * Delete All Billing Modifiers for a given Billing Gropu
 *
 * @param {obj} root The rootValue passed from the Apollo server configuration.
 * @param {DeleteAllBillingGroupModifiersInput} args
 * @param {ExpressContext} context this includes the context passed from the apolloServer query
 *     { sqlClient, hasPermissions, keycloakGrant, requestCache }
 *
 * @return {String} Success
 */
export const deleteAllBillingModifiersByBillingGroup = async (
  _,
  args: DeleteAllBillingGroupModifiersInput,
  context: { models: any; hasPermission: any }
) => {
  const { hasPermission, models } = context;
  const { input: groupInput } = args;

  const group = await models.GroupModel.loadGroupByIdOrName(groupInput)

  // Permissions
  await hasPermission('billing_modifier', 'delete', {group: group.id});

  // Action
  return models.BillingModel.deleteAllBillingGroupModifiers(groupInput);
};

/**
 * Get All Billing Modifiers Added to a Billing Group
 *
 * @param {obj} root The rootValue passed from the Apollo server configuration.
 * @param {BillingModifiersInput} args
 * @param {ExpressContext} context this includes the context passed from the apolloServer query
 *     { sqlClient, hasPermissions, keycloakGrant, requestCache }
 *
 * @return {[BillingModifier]} All modifiers associated to the billing Group
 */
export const getBillingModifiers = async (
  _,
  args: BillingModifiersInput,
  context: { models: any; hasPermission: any, keycloakGrant: any }
) => {
  const { hasPermission, models, keycloakGrant } = context;
  const { input: groupInput, month } = args;

  try {
    // Permissions
    await hasPermission('group', 'viewAll');

    // Action
    return models.BillingModel.getBillingModifiers(groupInput, month);
  } catch (err) {
    if (!keycloakGrant) {
      logger.warn('No grant available for getBillingModifiers');
      return [];
    }

    throw new Error('User does not have viewAll permissions for this group.');
  }
};

export const getAllModifiersByGroupId = async (root, input, context) =>
  getBillingModifiers(root, { input: { id: root.id } }, { ...context });
