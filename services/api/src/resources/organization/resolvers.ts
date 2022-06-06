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
    { sqlClientPool, hasPermission }
) => {
    // TODO: update this with permission check for organization owners to list all orgs
    // they may be in
    await hasPermission('organization', 'viewAll');

    return query(sqlClientPool, 'SELECT * FROM organization');
};