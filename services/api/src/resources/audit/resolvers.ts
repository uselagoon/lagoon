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

  // default results limit to 100
  let limit = 100;

  if (input) {
    if (input.startDate) {
      queryBuilder = queryBuilder.where('created', '>=', input.startDate);
    }

    if (input.endDate) {
      queryBuilder = queryBuilder.where('created', '<=', input.endDate);
    }

    if (input.startDate && input.endDate) {
      // if a date range is requested, don't limit the results
      limit = 0;
    }

    // limit could be 0
    if (input.limit != undefined) {
      limit = input.limit;
    }

    if (input.userId) {
      queryBuilder = queryBuilder.where('usid', input.userId);
    }

    if (input.emailAddress) {
      queryBuilder = queryBuilder.where('email_address', input.emailAddress);
    }

    if (input.resourceId) {
      queryBuilder = queryBuilder.where('resource_id', input.resourceId);
    }

    if (input.resourceType) {
      queryBuilder = queryBuilder.where('resource_type', input.resourceType);
    }

    if (input.resourceDetails) {
      queryBuilder = queryBuilder.where('resource_details','LIKE',`%${input.resourceDetails}%`);
    }

    if (input.linkedResourceId) {
      queryBuilder = queryBuilder.where('linked_resource_id', input.linkedResourceId);
    }

    if (input.linkedResourceType) {
      queryBuilder = queryBuilder.where('linked_resource_type', input.linkedResourceType);
    }

    if (input.linkedResourceDetails) {
      queryBuilder = queryBuilder.where('linked_resource_details','LIKE',`%${input.linkedResourceDetails}%`);
    }

    if (input.auditEvent) {
      queryBuilder = queryBuilder.where('audit_event', input.auditEvent);
    }

    if (input.impersonatorId) {
      queryBuilder = queryBuilder.where('impersonator_id', input.impersonatorId);
    }

    if (input.impersonatorUsername) {
      queryBuilder = queryBuilder.where('impersonator_username', input.impersonatorUsername);
    }

    if (input.ipAddress) {
      queryBuilder = queryBuilder.where('ip_address', input.ipAddress);
    }

    if (input.source) {
      queryBuilder = queryBuilder.where('source', input.source);
    }

    if (input.order) {
      queryBuilder = queryBuilder.orderBy(input.order);
    }
  }

  // apply the limit if required
  if (limit > 0) {
    queryBuilder = queryBuilder.limit(limit);
  }

  const rows = await query(sqlClientPool, queryBuilder.toString());
  return rows
};