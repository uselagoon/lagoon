// @ts-ignore
import * as R from 'ramda';
import { ResolverFn } from '../';
import { logger } from '../../loggers/logger';
import { query, isPatchEmpty, knex } from '../../util/db';
import { Sql } from './sql';

export const addOrganization: ResolverFn = async (
  args,
  { input },
  { sqlClientPool, hasPermission }
) => {
    try {
        await hasPermission('organization', 'add');
        const { insertId } = await query(sqlClientPool, Sql.insertOrganization(input));
        const rows = await query(sqlClientPool, Sql.selectOrganization(insertId));
        return R.prop(0, rows);
    }  catch (err) {
        throw new Error(`There was an error creating the organization ${input.name}`);
    }
};

export const updateOrganization: ResolverFn = async (
    root,
    { input },
    { sqlClientPool, hasPermission }
) => {
    await hasPermission('organization', 'update');

    const oid = input.id.toString();

    if (isPatchEmpty(input)) {
      throw new Error('input.patch requires at least 1 attribute');
    }

    await query(sqlClientPool, Sql.updateOrganization(input));
    const rows = await query(sqlClientPool, Sql.selectOrganization(oid));

    return R.prop(0, rows);
};

export const getOrganizationById: ResolverFn = async (
    organization,
    args,
    { sqlClientPool, hasPermission }
) => {
    let oid = args.organization;
    if (organization) {
      oid =organization;
    }
    const rows = await query(
        sqlClientPool,
        `SELECT *
        FROM organization
        WHERE id = :organization`,
        args
    );
    const orgResult = rows[0];

    if (!orgResult) {
        return null;
    }

    await hasPermission('organization', 'view', {
        organization: oid,
    });

    return orgResult;
};

export const getAllOrganizations: ResolverFn = async (
    root,
    args,
    { sqlClientPool, models, hasPermission, keycloakGrant }
) => {
    let userOrganizationIds: number[];

    try {
      await hasPermission('organization', 'viewAll');
    } catch (err) {
      if (!keycloakGrant) {
        logger.warn('No grant available for getAllProjects');
        return [];
      }

      userOrganizationIds = await models.UserModel.getAllOrganizationIdsForUser({
        id: keycloakGrant.access_token.content.sub
      });
    }
    let queryBuilder = knex('organization');

    if (userOrganizationIds) {
      queryBuilder = queryBuilder.whereIn('id', userOrganizationIds);
    }
    const rows = await query(sqlClientPool, queryBuilder.toString());
    return rows;
};