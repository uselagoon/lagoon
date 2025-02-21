import * as R from 'ramda';
import { ResolverFn } from '../';
import { knex, query } from '../../util/db';


export const getAuditLogs: ResolverFn = async (
  root,
  { input },
  { sqlClientPool, hasPermission }
) => {
  await hasPermission('project', 'viewAll');

  let queryBuilder = knex('audit_log');

  if (input && input.userId) {
    queryBuilder = queryBuilder.where('usid', input.userId);
  }

  if (input && input.emailAddress) {
    queryBuilder = queryBuilder.where('email_address', input.emailAddress);
  }

  if (input && input.resourceId) {
    queryBuilder = queryBuilder.where('resource_id', input.resourceId);
  }

  if (input && input.resourceType) {
    queryBuilder = queryBuilder.where('resource_type', input.resourceType);
  }

  if (input && input.resourceDetails) {
    queryBuilder = queryBuilder.where('resource_details','LIKE',`%${input.resourceDetails}%`);
  }

  if (input && input.linkedResourceId) {
    queryBuilder = queryBuilder.where('linked_resource_id', input.linkedResourceId);
  }

  if (input && input.linkedResourceType) {
    queryBuilder = queryBuilder.where('linked_resource_type', input.linkedResourceType);
  }

  if (input && input.linkedResourceDetails) {
    const l =
    queryBuilder = queryBuilder.where('linked_resource_details','LIKE',`%${input.linkedResourceDetails}%`);
  }

  if (input && input.auditEvent) {
    queryBuilder = queryBuilder.where('audit_event', input.auditEvent);
  }

  if (input && input.impersonatorId) {
    queryBuilder = queryBuilder.where('impersonator_id', input.impersonatorId);
  }

  if (input && input.impersonatorUsername) {
    queryBuilder = queryBuilder.where('impersonator_username', input.impersonatorUsername);
  }

  if (input && input.ipAddress) {
    queryBuilder = queryBuilder.where('ip_address', input.ipAddress);
  }

  if (input && input.source) {
    queryBuilder = queryBuilder.where('source', input.source);
  }

  if (input && input.startDate) {
    queryBuilder = queryBuilder.where('created', '>=', input.startDate);
  }

  if (input && input.endDate) {
    queryBuilder = queryBuilder.where('created', '<=', input.endDate);
  }

  if (input && input.order) {
    queryBuilder = queryBuilder.orderBy(input.order);
  }

  const rows = await query(sqlClientPool, queryBuilder.toString());
  return rows
};